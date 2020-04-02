'use strict'

let logger = require('../modules/Logger').logger
let defaults = require('../globals')
let i18n = require('../modules/I18n')


/**
 * Класс цели
 * @constructor
 */
function Contract () {
    let self = this

    self.attributes = {
        id: null,
        goal_id: null,
        user_id: null,
        occupation: null,
        week_days: [],
        month_days: [],
        next_run: null,
        last_run: null
    }
    
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
    }
    
    self.get = (key) => {
        return key && typeof key !== 'undefined' ? self.attributes[key] : self.attributes
    }
}

logger.info('🔸️  Contract model initiated')

module.exports.Contract = Contract

