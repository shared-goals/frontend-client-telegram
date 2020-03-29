'use strict'

require('dotenv').config()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

let logger = require('./Logger').logger
let MakeRequest = require('./Common').MakeRequest
let msgActions = require('./MsgActions').msgActions
let currentUser = require('./User').currentUser
let updateCounter = require('../globals').updateCounter
let TGAPI = require('../globals').TGAPI

const port = process.env.PORT       // Порт на котором поднимается сервер обработки хуков
const transportType = 'webhook'     // Тип транспорта сообщений: polling|webhook
const doReport = false              // Логировать ли количества сообщения в лог

let inProgressUpdate = false
let lastUpdate = 0
let msgCounter = 0


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
function MsgObserver(){
    let self = this
    
    let listeners = []              // Массив обработчиков
    let timeouts = {                // Таймауты
        observe: 1000,              // ... наблюдения за командами от Telegram
        report: 60000               // ... логирования сообщений
    }
    
    /**
     * Метод добавляет слушатель / обработчик команд
     * @param func
     * @returns {MsgObserver}
     */
    function subscribe (func) {
        listeners.push(func)
        return self
    }
    
    /**
     * Метод запускает конкретный слушатель / обработчик команд
     * @param data
     * @returns {MsgObserver}
     */
    function triggered (data) {
        listeners.forEach((func) => {
            func(data.message || data.callback_query)
        })
        return self
    }
    
    /**
     * Обрабатывает поступившее от сервера Telegram сообщение
     * @param item Объект сообщения
     */
    async function handleMessage (item) {
        let msg = item.message || item.callback_query
        let log = `\r\nНовое сообщение от ${msg.from.username}\r\nPOST ${TGAPI}/getUpdates\r\n`
        
        if (item.update_id > lastUpdate) {
            lastUpdate = item.update_id
        }
        
        logger.info(msg.data ? `${log}inline кнопка: ${msg.data}\r\n` : `${log}Текст: ${msg.text}\r\n`)
        
        return await triggered(item)
    }
    
    /**
     * Стартуем веб-сервер, принимающий хуки от сервиса Telegram
     */
    function startWebHookObserver () {
        const requestHandler = (request, response) => {
            let body = [], req = null, resp = null
            request.on('error', (err) => {
                logger.error(err);
                
                response.statusCode = 404;
            }).on('data', (chunk) => {
                body.push(chunk)
                response.statusCode = 404;
            }).on('end', async function () {
                body = Buffer.concat(body).toString()
                try {
                    req = JSON.parse(body)
                }
                catch (e) {
                    // logger.info('Ошибка request body json-parse')
                    // logger.info('  body: "', body, '"')
                    // logger.info(e)
                }
                if (!req || req === '') {
                    req = {
                        "update_id": 603183293,
                        "message": {
                            "message_id": 740,
                            "from": {
                                "id": 131273512,
                                "is_bot": false,
                                "first_name": "Eugene",
                                "last_name": "Kartavchenko",
                                "username": "ewgeniyk",
                                "language_code": "ru"
                            },
                            "chat": {
                                "id": 131273512,
                                "first_name": "Eugene",
                                "last_name": "Kartavchenko",
                                "username": "ewgeniyk",
                                "type": "private"
                            },
                            "date": 1585399596,
                            "text": request.url
                        }
                    }
                }
                response.statusCode = 200;
                let resp = await commonHandler(req.message || req.callback_query)
                if (resp.hasOwnProperty('type')) {
                    response.setHeader('Content-Type', resp.type);
                    response.end(resp.text || '')
                } else
                    if (typeof resp === 'string') {
                        response.setHeader('Content-Type', 'text/html');
                        response.end(resp.text || resp.html || JSON.stringify(resp))
                    } else {
                        response.setHeader('Content-Type', 'application/json');
                        response.end(JSON.stringify(resp) || '')
                    }
            })
        }
    
        if (port === 443) {
            const config = {
                domain: 'ewg.ru.com',
                https: {
                    port: port, // any port that is open and not already used on your server
                    options: {
                        key: fs.readFileSync(path.resolve(process.cwd(), '../certs/certificate.key'), 'utf8').
                            toString(),
                        cert: fs.readFileSync(path.resolve(process.cwd(), '../certs/certificate.crt'), 'utf8').
                            toString(),
                    },
                },
            }
            self.server = https.createServer(config.https.options, requestHandler)
            self.server.listen(port, (err) => {
                if (err) {
                    return logger.info('something bad happened', err)
                }
                logger.info(`server is listening on ${port}`)
            })
        } else {
            self.server = http.createServer(requestHandler)
            self.server.listen(port, (err) => {
                if (err) {
                    return logger.info('something bad happened', err)
                }
                logger.info(`server is listening on ${port}`)
            })
        }
    }
    
    /**
     * Стартуем веб-сервер, отправляющий запросы и обрабатывающий ответы от сервиса Telegram
     */
    function startPollingObserver () {
        setInterval(function () {
            if (!inProgressUpdate) {
                inProgressUpdate = true
                makeRequest('getUpdates', {offset: lastUpdate + 1})
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
    }
    
    /**
     * Метод запускает наблюдение за сообщениями
     * @returns {MsgObserver}
     */
    function start () {
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
     * @returns {MsgObserver}
     */
    function init () {
        // Если в настройках задан репортинг в лог - запускаем его
        if (doReport === true) {
            setInterval(function () {
                logger.info(`\r\nЗа 1min отправлено ${updateCounter} POST запросов на Telegram API getUpdates.\r\nОбработано ${msgCounter} сообщений\r\n`)
                msgCounter = 0
                updateCounter = 0
            }, timeouts.report)
        }
        
        // подписываем основной общий слушатель / обработчик команд
        subscribe(commonHandler)
        return self
    }
    
    /**
     * Основной общий обработчик команд
     * @param msg
     * @returns {Promise.<*>}
     */
    async function commonHandler (msg) {
        let ret = null

        let opt = msgActions.get(msg.data || msg.callback_data || msg.text.replace(/^\//, ''))
        if (typeof opt !== 'undefined') {
            opt.chat_id = msg.from.id
            if (opt.hasOwnProperty('callback_data')) {
                ret = await opt.callback_data(msg)
            } else {
                ret = opt
            }
        } else {
            logger.error('Error: action не найден:', msg.text || msg.data || msg.callback_data)
            ret = {text: ''}
        }
    
        if (ret.skip_logging !== true) {
            logger.info(ret)
        }
        if (typeof ret !== 'string' && currentUser && typeof currentUser !== 'undefined') {
            ret.user_id = currentUser.id || null
        }

        MakeRequest('sendMessage', ret)
            .then(() => {
                logger.info(`\r\nОтправка сообщения от ${msg.from.username}\r\nPOST ${TGAPI}/sendMessage\r\nBody: ${JSON.stringify(opt, '', 4)}\r\n`)
            })

        return ret
    }
    
    logger.info('Включен режим опроса, демон опрашивает сервера Telegram на наличие обновлений для бота')
    
    self.subscribe = subscribe
    self.triggered = triggered
    self.commonHandler = commonHandler
    self.init = init
    self.start = start
}

let msgObserver = new MsgObserver()

module.exports.msgObserver = msgObserver
