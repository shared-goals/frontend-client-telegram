require('dotenv').config()

'use strict'

let request = require('request')
let token = '1102699634:AAHKHlzKqPddGpzBGi4sGzfDYeH6n1qFYUc'
let TGAPI = `https://api.telegram.org/bot${token}`
let SGAPI = `http://127.0.0.1:3030`
let msgObserver = new MsgObserver()
let msgActions = new MsgActions()
let inProgressUpdate = false
let lastUpdate = 0
let msgCounter = 0
let updateCounter = 0
let currentUser = null

function MsgActions () {
    this.list = {}
    this.idByKeyMap = {}
    this.set = (action) => {
        this.list[action.key] = action
        this.idByKeyMap[action.id] = action.key
    }
    this.get = (key) => {
        return (typeof this.list[key] !== 'undefined' ? this.list[key] : this.list[this.idByKeyMap[key]])
    }
}

// назначаем интерфейнсные скрины / кнопки
msgActions.set({
    id: 'welcome',
    key: 'welcome',
    text: 'Welcome to SharedGoals service.',
    reply_markup: JSON.stringify({
        keyboard: [
            [
                {text: `🧰 Goals`, callback_data: 'goals'},
                {text: `🛠 Settings`}
            ]
        ],
        resize_keyboard: true
    })
})
msgActions.set({
    // external: true,
    id: 'goals',
    key: '🧰 Goals',
    text: 'What do you mean?',
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                {text: `🗂 List all`, callback_data: 'listAllGoals'},
                {text: `🧰 New goal`, callback_data:'createNewGoal'},
            ],[
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})

// Settings from subs to parent
msgActions.set({
    id: 'changeLanguage',
    key: `🇷🇺 Change language`,
    text: `🇷🇺 Change language`,
    callback_data:'chLang'
})
msgActions.set({
    id: 'chLang',
    key: `🇷🇺 Select language`,
    text: `🇷🇺 Select language`,
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                {text: `🇬🇧 English`, callback_data:'en'},
                {text: `🇷🇺 Русский`, callback_data:'ru'}
            ],[
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})
msgActions.set({
    id: 'settings',
    key: '🛠 Settings',
    text: 'Select Settings below',
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                msgActions.get('changeLanguage')
            ],[
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})
msgActions.set({
    id: 'listAllGoals',
})


// назначаем кастомные слушатели и запускаем
msgObserver
    .subscribe(listAllGoalsHandler)
    .subscribe(startHandler)
    .start()

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
 
 **/

function MsgObserver(){
    let self = this

    const doReport = false  // Логировать ли количества сообщения в лог

    let listeners = []      // Массив обработчиков
    let timeouts = {        // Таймауты
        observe: 1000,      // ... наблюдения за командами от Telegram
        report: 60000       // ... логирования сообщений
    }
    
    /**
     * Метод добавляет слушатель / обработчик команд
     * @param func
     * @returns {MsgObserver}
     */
    function subscribe(func){
        listeners.push(func)
        return self
    }
    
    /**
     * Метод запускает конкретный слушатель / обработчик команд
     * @param data
     * @returns {MsgObserver}
     */
    function triggered(data){
        listeners.forEach((func) => {
            func(data.message || data.callback_query)
        })
        return self
    }
    
    /**
     * Метод получает новые данные с сервера телеграма
     **/
    function update(observer){
        if(!inProgressUpdate){
            let msg
            inProgressUpdate = true
            
            makeRequest('getUpdates', {offset: lastUpdate + 1})
                .then( (data) => {
                    data.result.forEach( (item) => {
                        msgCounter += 1
                        msg = item.message || item.callback_query
                        let log = `\r\nНовое сообщение от ${msg.from.username}\r\nPOST ${TGAPI}/getUpdates\r\n`
                        
                        if (item.update_id > lastUpdate) {
                            lastUpdate = item.update_id
                        }

                        if (msg.data) {
                            console.log(`${log}inline кнопка: ${msg.data}\r\n`)
                        } else {
                            console.log(`${log}Текст: ${msg.text}\r\n`)
                        }
                        
                        
                        observer.triggered(item)
                    })
                    
                    inProgressUpdate = false
                })
        }
    }
    
    /**
     * Метод запускает наблюдение за сообщениями
     * @returns {MsgObserver}
     */
    function start () {
        setInterval(update, timeouts.observe, self)
        return self
    }

    // Если в настройках задан репортинг в лог - запускаем его
    if (doReport === true) {
        setInterval(function () {
            console.log(`\r\nЗа 1min отправлено ${updateCounter} POST запросов на Telegram API getUpdates.\r\nОбработано ${msgCounter} сообщений\r\n`)
            msgCounter = 0
            updateCounter = 0
        }, timeouts.report)
    }
    
    // подписываем основной общий слушатель / обработчик команд
    subscribe( function (msg) {
        let opt = msgActions.get(msg.data || msg.text.replace(/^\//, ''))
        if (typeof opt !== 'undefined') {
            opt.chat_id = msg.from.id
            makeRequest('sendMessage', opt)
                .then(() => {
                    console.log(`\r\nОтправка сообщения от ${msg.from.username}\r\nPOST ${TGAPI}/sendMessage\r\nBody: ${JSON.stringify(opt, '', 4)}\r\n`)
                })
        } else {
            console.error('action не найден', msg)
        }
    })
    
    console.log('Включен режим опроса, демон опрашивает сервера Telegram на наличие обновлений для бота')
    
    self.subscribe = subscribe
    self.triggered = triggered
    self.start = start
}

/**
 * Вспомогательная функция для использования внешних и внутренних API
 **/
function makeRequest(method, args = {}) {
    let address = args.external === true ? SGAPI : TGAPI
    return new Promise((resolve, reject) => {
        updateCounter++
        let opt = {
            method: args.method || 'POST',
            url: `${address}/${method}`,
            form: args,
            user_id: currentUser ? currentUser.id : 0
        }
        if (args.external) console.log(opt)
        request(opt, (error, response, body) => {
            if (!error) {
                resolve(JSON.parse(body))
            } else {
                reject(error)
            }
        })
    })
}

/**
 *
 */
function startHandler (msg) {
    if(msg.text && msg.text === '/start'){
        let opt = {
            chat_id: msg.from.id,
            external: true,
            method: 'GET'
        }
        let action
       
        makeRequest('sendMessage', {
            chat_id: msg.from.id,
            text: 'Getting user data...'
        })
        
        makeRequest('users/email/' + (msg.from.username || msg.from.id) + '@t.me', opt)
            .then((response) => {
                currentUser = response
                if (!response.hasOwnProperty('id')) {
                    makeRequest('sendMessage', {
                        chat_id: msg.from.id,
                        text: 'Registering user...'
                    })
                    let opt = {
                        chat_id: msg.from.id,
                        external: true,
                        method: 'POST',
                        email: msg.from.username + '@t.me',
                        password: msg.from.id
                    }
                    makeRequest('register', opt)
                        .then((response) => {
                            currentUser = response
                            makeRequest('sendMessage', {
                                chat_id: msg.from.id,
                                text: 'User ' + msg.from.username + ' registered...'
                            })
                            action = msgActions.get('welcome')
                            action.chat_id = msg.from.id
                            makeRequest('sendMessage', action)
                        })
                } else {
                    action = msgActions.get('welcome')
                    action.chat_id = msg.from.id
                    makeRequest('sendMessage', action)
                }
            })
    }
}

/**
 *
 */
function listAllGoalsHandler (msg) {
    if(msg.data && msg.data === 'listAllGoals'){
        let opt = {
            chat_id: msg.from.id,
            external: true,
            method: 'GET'
        }
        
        makeRequest('sendMessage', {
            chat_id: msg.from.id,
            text: 'Fetching goals data...'
        })
        makeRequest('goals', opt)
            .then((response) => {
                let goals = []
                response.forEach((goal) => {
                    goals.push([
                        {
                            text: goal.title,
                            callback_data: 'goal_id_' + goal.id
                        },
                    ])
                    msgActions.set({
                        id: 'goal_id_' + goal.id,
                        key: '🛠 Goal ' + goal.id,
                        text: goal.text,
                        reply_markup: JSON.stringify({
                            inline_keyboard: [
                                [
                                    {text: `🗂 Set contract`, callback_data: 'setGoalContract'},
                                    {text: `💵 Set commit`, callback_data: 'setGoalCommit'}
                                ],[
                                    {text: `⬅️ Back`, callback_data: 'listAllGoals'}
                                ]
                            ]
                        })
                    })
                })
                goals.push([
                    {text: `🧰 New goal`, callback_data:'createNewGoal'},
                    {text: `⬅️ Back`, callback_data:'welcome'}
                ])
                makeRequest('sendMessage', {
                    chat_id: msg.from.id,
                    text: 'Your goals:',
                    reply_markup: JSON.stringify({
                        inline_keyboard: goals
                    })
                })
            })
    }
}