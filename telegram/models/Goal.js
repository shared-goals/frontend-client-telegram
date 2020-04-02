'use strict'

let Contract = require('./Contract').Contract
let logger = require('../modules/Logger').logger


/**
 * Класс цели
 * @constructor
 */
function Goal () {
    let self = this

    self.attributes = {
        id: null,
        title: null,
        text: null,
        contract: new Contract()
    }
    
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
    }
    
    self.get = (key) => {
        return key && typeof key !== 'undefined' ? self.attributes[key] : self.attributes
    }
    
    self.toJSON = () => {
        let obj = self.get()
        if (obj.contract.hasOwnProperty('get')) {
            obj.contract = obj.contract.get()
        }
    }
    
    self.getContract = () => {
        'use strict'
        
        return self.get('contract')
    }

    self.setContract = (data) => {
        'use strict'
        
        let currentContract = self.getContract()
        if (!currentContract.hasOwnProperty('set')) {
            self.set('contract', (new Contract()).set(currentContract))
        }

        self.getContract().set(data)
    }
}

logger.info('🔸️  Goal model initiated')

module.exports.Goal = Goal