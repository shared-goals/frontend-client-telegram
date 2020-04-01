'use strict'

let session = require('../models/Session')
let defaults = require('../globals')
let logger = require('./Logger').logger
let path = require('path')

/**
 * Класс локализатора
 * @constructor
 */
function I18n (opts) {
    let self = this
    
    self.attributes = {}
    self.translations = {}
    
    self.t = (resourceKey) => {
        return resourceKey
            .split('.')
            .reduce((acc, key) => acc && acc[key], self.translations)
    }
    
    self.setTranslations = (lang) => {
        self.translations = require(self.attributes['directory'] + '/' + (lang || self.attributes.lang || defaults.lang))
    }
    
    self.setLang = (lang) => {
        self.attributes.lang = lang
        self.setTranslations(lang)
    }
    
    self.init = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
        self.setTranslations()
    }
    
    self.init(opts || {})
}

// i18n options
const i18n = new I18n({
    directory: path.resolve(__dirname, '../locales'),
    lang: defaults.lang
})

logger.info('🔹️  I18n module initiated')

module.exports = i18n
