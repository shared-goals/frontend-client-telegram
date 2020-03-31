'use strict'


/**
 * Класс текущего пользователя
 * @constructor
 */
function User () {
    this.attributes = {
        id: null,
        email: null
    }
    
    this.set = (data) => {
        Object.assign(this.attributes, data)
    }

    this.get = () => {
        return this.attributes
    }
    
    this.getId = () => {
        'use strict'
        
        return this.attributes.id
    }
}

console.log('🔸️  User model initiated')

let currentUser = new User()

module.exports.currentUser = currentUser