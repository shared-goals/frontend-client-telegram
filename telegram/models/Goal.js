'use strict'

let Contract = require('./Contract').Contract
let logger = require('../modules/Logger').logger


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

    this.get = (key) => {
        return key && typeof key !== 'undefined' ? this.attributes[key] : this.attributes
    }
    
    this.toJSON = () => {
        let obj = this.get()
        if (obj.contract.hasOwnProperty('get')) {
            obj.contract = obj.contract.get()
        }
    }
    
    this.getContract = () => {
        'use strict'
        
        return this.get('contract')
    }

    this.setContract = (data) => {
        'use strict'
        let currentContract = this.getContract()
        if (!currentContract.hasOwnProperty('set')) {
            this.set('contract', (new Contract()).set(currentContract))
        }

        this.getContract().set(data)
    }
}

logger.info('🔸️  Goal model initiated')

module.exports.Goal = Goal