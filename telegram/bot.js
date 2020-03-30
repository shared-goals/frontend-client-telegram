'use strict'

let msgObserver = require('./modules/MsgObserver').msgObserver

require('./actions/start')
require('./actions/settings')
require('./actions/goals')
require('./actions/nohooks')

// назначаем кастомные слушатели и запускаем
msgObserver
    .init()
    .start()
