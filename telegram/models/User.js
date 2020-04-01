'use strict'

let logger = require('../modules/Logger').logger


/**
 * Класс текущего пользователя
 * @constructor
 */
function User () {
    this.attributes = {
        id: null,
        email: null,
        telegram_id: null
    }
    
    this.set = (data) => {
        Object.assign(this.attributes, data)
    }
    
    this.get = (key) => {
        return key && typeof key !== 'undefined' ? this.attributes[key] : this.attributes
    }
    
    this.getId = () => {
        'use strict'
        
        return this.attributes.id
    }
}

logger.info('🔸️  User model initiated')

let currentUser = new User()

module.exports.currentUser = currentUser