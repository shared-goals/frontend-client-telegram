'use strict'

let logger = require('../modules/Logger').logger


/**
 * Класс цели
 * @constructor
 */
function Contract () {
    let self = this

    this.attributes = {
        id: null,
        goal_id: null,
        occupation: null
    }
    
    this.set = (data) => {
        Object.assign(this.attributes, data)
        return self
    }
    
    this.get = (key) => {
        return key && typeof key !== 'undefined' ? this.attributes[key] : this.attributes
    }
}

logger.info('🔸️  Contract model initiated')

module.exports.Contract = Contract

