'use strict'

/**
 * Класс цели
 * @constructor
 */
function Contract () {
    this.attributes = {
        id: null,
        goal_id: null,
        occupation: {
            every: null,
            weekdays: {
                monday: false,
                tuesday: false,
                wednesday: false,
                thursday: false,
                friday: false,
                saturday: false,
                sunday: false
            },
        }
    }
    
    this.set = (data) => {
        Object.assign(this.attributes, data)
        return self
    }

    this.get = () => {
        return this.attributes
    }
    
    this.getId = () => {
        'use strict'
        
        return this.attributes.id
    }
}

console.log('🔸️  Contract model initiated')

module.exports.Contract = Contract

