'use strict'

let Contract = require('./Contract').Contract


/**
 * Класс цели
 * @constructor
 */
function Goal () {
    this.attributes = {
        id: null,
        title: null,
        text: null,
        contract: new Contract()
    }
    
    this.set = (data) => {
        Object.assign(this.attributes, data)
    }

    this.get = () => {
        return this.attributes
    }
    
    this.getId = () => {
        'use strict'
        
        return this.get().id
    }
    
    this.getTitle = () => {
        'use strict'
        
        return this.get().title
    }
    
    this.getContract = () => {
        'use strict'
        
        return this.get().contract
    }

    this.setContract = (data) => {
        'use strict'
        
        this.getContract().set(data)
    }
}

console.log('🔸️  Goal model initiated')

module.exports.Goal = Goal