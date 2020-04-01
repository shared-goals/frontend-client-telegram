'use strict'

require('dotenv').config()

let defaults = require('../globals')
let logger = require('../modules/Logger').logger
let scenes = require('../modules/Scenes')
let session = require('../models/Session')
let i18n = require('../modules/I18n')


let controller = {
    
    /**
     * Обработчик нажатия на кнопку "сменить язык" в форме настроек
     * @returns {Promise.<void>}
     */
    changeLanguage: async() => {
        return scenes.all.get('changeLanguageMenu')
    },
}

module.exports = controller;