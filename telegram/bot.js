'use strict'

let session = require('./models/Session')
let observer = require('./modules/Observer').observer

// Подключаем инициализации сценариев
require('./scenes/start')
require('./scenes/settings')
require('./scenes/goals')
require('./scenes/nohooks')

// получаем и сохраняем в сессии с сервера Telegram информацию о боте
;session.currentSession.getInfo().then(() => {

    // назначаем кастомные слушатели и запускаем
    observer
        .init()
        .start()
})
