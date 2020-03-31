'use strict'

let session = require('../models/Session')
let path = require('path')

// i18n options
const i18n = new I18n({
    directory: path.resolve(__dirname, '../locales')
})

/**
 * Класс локализатора
 * @constructor
 */
function I18n (opts) {
    let self = this
    
    self.attributes = {}
    self.translations = {}
    
    init(opts || {})
    
    function t (resourceKey) {
        return resourceKey
            .split('.')
            .reduce((acc, key) => acc && acc[key], self.translations)
    }
    
    function init (data) {
        self.attributes = Object.assign({}, self.attributes, data)
        self.translations = require(self.attributes['directory'] + '/' + session.currentSession.getLang())
    }
    
    self.t = t
}

console.log('🔹️  I18n module initiated')

module.exports = i18n
