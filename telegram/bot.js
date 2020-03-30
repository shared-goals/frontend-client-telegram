'use strict'

let msgObserver = require('./modules/MsgObserver').msgObserver
require('./init.js')

// назначаем кастомные слушатели и запускаем
msgObserver
    .init()
    .start()
