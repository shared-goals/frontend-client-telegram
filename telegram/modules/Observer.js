'use strict'

require('dotenv').config()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

let logger = require('./Logger').logger
let MakeRequest = require('./Request').MakeRequest
let scenes = require('./Scenes')
let session = require('../models/Session')
let defaults = require('../globals')

const transportType = 'webhook'     // Тип транспорта сообщений: polling|webhook
const doReport = false              // Логировать ли количества сообщения в лог

let inProgressUpdate = false
let lastUpdate = 0
let msgCounter = 0
let nextCallback = null             // Приоритетный слушатель для следующего колла

let listeners = []                  // Массив обработчиков
let timeouts = {                    // Таймауты
    observe: 1000,                  // ... наблюдения за командами от Telegram
    report: 60000                   // ... логирования сообщений
}


/**
 * Наблюдатель который оповещает о новых сообщениях
 * Переделать на web_hook от Yandex Function https://functions.yandexcloud.net/d4efasnhvk9uo58bdrju
 
 https://cloud.yandex.ru/docs/functions/quickstart/function-quickstart
 
$ yc serverless function version create \
--function-name=my-nodejs-function \ # Имя функции.
--runtime nodejs12 \ # Среда выполенения.
--entrypoint index.handler \ # Обработчик, указывается в формате <имя файла с функцией>.<имя обработчика>.
--memory 128m \ # Объем RAM.
--execution-timeout 5s \ # Максимальное время выполнения функции до таймаута.
--source-path ./hello-js.zip # ZIP-архив c кодом функции и всеми необходимыми зависимостями.
 
 * @constructor
 **/
function Observer(){
    let self = this
    
    /**
     * Метод добавляет слушатель / обработчик команд
     * @param func
     * @returns {Observer}
     */
    self.subscribe = (func) => {
        listeners.push(func)
        return self
    }
    
    /**
     * Метод запускает конкретный слушатель / обработчик команд
     * @param data
     * @returns {Observer}
     */
    self.triggered = (data) => {
        listeners.forEach((func) => {
            func(data.message || data.callback_query)
        })
        return self
    }
    
    /**
     * Метод устанавливает приоритетного слушателя для следующего введенного сообщения
     * @param data
     * @returns {Observer}
     */
    self.setNextCallback = (callback) => {
        nextCallback = callback || concole.error
        return self
    }
    
    /**
     * Обрабатывает поступившее от сервера Telegram сообщение
     * @param item Объект сообщения
     */
    async function handleMessage (item) {
        let msg = item.message || item.callback_query
        let log = `\r\nНовое сообщение от ${msg.from.username}\r\nPOST ${defauts.TGAPI}/getUpdates\r\n`
        
        if (item.update_id > lastUpdate) {
            lastUpdate = item.update_id
        }
        
        logger.info(msg.data ? `${log}inline кнопка: ${msg.data}\r\n` : `${log}Текст: ${msg.text}\r\n`)
        
        return await self.triggered(item)
    }
    
    /**
     * Стартуем веб-сервер, принимающий хуки от сервиса Telegram
     */
    function startWebHookObserver () {
        const requestHandler = (request, response) => {
            let body = []

            request.on('error', (err) => {
                logger.error(err)
                response.statusCode = 404
            }).on('data', (chunk) => {
                body.push(chunk)
                response.statusCode = 404
            }).on('end', async function () {
                let msg, req = {}, resp

                body = Buffer.concat(body).toString()
                try {
                    req = JSON.parse(body)
                }
                catch (e) {
                    // logger.info('Ошибка request body json-parse')
                    // logger.info('  body: "', body, '"')
                    // logger.info(e)
                }
                
                let prev_msg_id = session.currentSession.get().prev_message_id
                let last_msg_id = session.currentSession.get().last_message_id
    
                // переписываем последний message_id в предпоследний
                if (prev_msg_id !== last_msg_id) {
                    session.currentSession.set({prev_message_id: last_msg_id})
                }
    
                // Если это коллбэк после нажатия кнопки
                if (req.hasOwnProperty('callback_query')) {
                    session.currentSession.set({last_message_id: req.callback_query.message.message_id})
                    msg = req.callback_query.data || req.callback_query.message
                } else {
                    session.currentSession.set({last_message_id: req.message.message_id})
                    msg = req.message
                }

                if (typeof msg === 'string') {
                    msg = {text: msg}
                }
    
                // Если в сессии еще нет информации о чате - фиксируем
                if (session.currentSession.getChat() === null && msg.hasOwnProperty('chat')) {
                    session.currentSession.set({chat: msg})
                }
    
                // Проверяем пользователя сессии, если не определен - логиним, регистрируем и т.д.
                await session.currentSession.checkUser(msg)
    
                // logger.info(req)
                // logger.info('prev', session.currentSession.get().prev_message_id)
                // logger.info('last', session.currentSession.get().last_message_id)

                // Запускаем асинхронный обработчик пришедшего сообщения, получаем ответ
                resp = await self.commonHandler(msg)
    
                // Ставим успешное выполнение
                response.statusCode = 200

                // Если в ответе присутствует какой-то конкретный Content-Type - устанавливаем его
                if (resp.hasOwnProperty('type')) {
                    response.setHeader('Content-Type', resp.type)
                    response.end(resp.text || '')
                } else {
                    // Или выводим с Content-type-ом html если вернулся текст, иначе - json
                    if (typeof resp === 'string') {
                        response.setHeader('Content-Type', 'text/html')
                        response.end(resp)
                    } else {
                        response.setHeader('Content-Type', 'application/json')
                        response.end(JSON.stringify(resp) || '')
                    }
                }
            })
        }
        
        // Если в настройах указан HTTPS-порт - стартуем https-сервер
        if (defaults.port === 443) {
            const config = {
                domain: 'ewg.ru.com',
                https: {
                    port: defaults.port, // any port that is open and not already used on your server
                    options: {
                        key: fs.readFileSync(path.resolve(process.cwd(), '../certs/certificate.key'), 'utf8').
                            toString(),
                        cert: fs.readFileSync(path.resolve(process.cwd(), '../certs/certificate.crt'), 'utf8').
                            toString(),
                    },
                },
            }
            self.server = https.createServer(config.https.options, requestHandler)
            self.server.listen(defaults.port, (err) => {
                if (err) {
                    return logger.error('something bad happened', err)
                }
            })
        
        // Иначе поднимаем http-сервер на указанном порту
        } else {
            self.server = http.createServer(requestHandler)
            self.server.listen(defaults.port, (err) => {
                if (err) {
                    return logger.error('something bad happened', err)
                }
            })
        }
    
        logger.info('Включен режим webhook-ов, создан обработчик запросов от серверов Telegram')
    }
    
    /**
     * Стартуем веб-сервер, отправляющий запросы и обрабатывающий ответы от сервиса Telegram
     */
    function startPollingObserver () {
        // Если в настройках задан репортинг в лог - запускаем его
        if (doReport === true) {
            setInterval(function () {
                logger.info(`\r\nЗа 1min отправлено ${defaults.updateCounter} `
                    + `POST запросов на Telegram API getUpdates.\r\nОбработано ${msgCounter} сообщений\r\n`)
                msgCounter = 0
                defaults.updateCounter = 0
            }, timeouts.report)
        }

        // И запускаем интервальный опрашивающий коллбэк
        setInterval(function () {
            if (!inProgressUpdate) {
                inProgressUpdate = true
                MakeRequest('getUpdates', {offset: lastUpdate + 1})
                    .then( (data) => {
                        if (data.ok !== false ) {
                            data.result.forEach( (item) => {
                                msgCounter += 1
                                handleMessage(item)
                            })
                        } else {
                            logger.error(data.error_code || '', data.description)
                        }
                        inProgressUpdate = false
                    })
            }
        }, timeouts.observe, self)
    
        logger.info('Включен режим опроса, демон опрашивает сервера Telegram на наличие обновлений для бота')
    }
    
    /**
     * Метод запускает наблюдение за сообщениями
     * @returns {Observer}
     */
    self.start = () => {
        logger.info(new Date(),
            'Бот '+ session.currentSession.getBot().username + ` стартовал на ${defaults.host}:${defaults.port}`)
        if (transportType === 'polling') {
            startPollingObserver()
        } else if (transportType === 'webhook') {
            startWebHookObserver()
        } else {
            logger.error('Некорректно задан тип транспорта сообщений ', transportType)
        }
        return self
    }
    
    /**
     * Инициализация наблюдателя
     * @returns {Observer}
     */
    self.init = () => {
        // подписываем основной общий слушатель / обработчик команд
        self.subscribe(self.commonHandler)
        return self
    }
    
    /**
     * Основной общий обработчик команд
     * @param msg
     * @returns {Promise.<*>}
     */
    self.commonHandler = async(msg) => {
        let ret = null, opt
        
        // Если был определен приоритетный следующий обработчик
        if (typeof nextCallback !== null) {
            // ... и если он был определен как функция - выполняем ее, фиксируем ответ, чистим
            if (typeof nextCallback === 'function') {
                ret = nextCallback.call(self, msg)
                nextCallback = null
            // ... или если он был определен как строка - сохраняем ее для выполнени обычным алгоритмом, чистим
            } else if (typeof nextCallback === 'string') {
                msg.data = nextCallback
                nextCallback = null
            }
        }
        opt = scenes.all.get(msg.data || msg.callback_data || msg.text.replace(/^\//, ''))
        
        if (typeof opt !== 'undefined') {
            if (opt.hasOwnProperty('callback_data')) {
                if (typeof opt.callback_data === 'function') {
                    ret = await opt.callback_data(msg)
                }
            } else {
                ret = opt
            }
            if (ret && typeof ret !== 'undefined') {
                if (ret.skip_logging !== true) {
                    logger.info(ret)
                }
                if (ret !== '' && ret.hasOwnProperty('text') && ret.text !== ''){
                    MakeRequest('sendMessage', ret)
                } else {
                    logger.error('Отсутствует текст')
                }
            } else {
                ret = {text: ''}
            }
        } else {
            logger.error('Error: action не найден:', msg.text || msg.data || msg.callback_data)
            ret = {text: ''}
        }
    
        return ret
    }
}

let observer = new Observer()

logger.info('🔹️  Observer module initiated')

module.exports.observer = observer
