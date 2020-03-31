'use strict'

let MakeRequest = require('../modules/Request').MakeRequest
let currentUser = require('./User').currentUser
let defaults = require('../globals')


/**
 * Класс текущей сессии
 * @constructor
 */
function Session () {
    let self = this
    
    this.attributes = {
        last_message_id: null,
        prev_message_id: null,
        user: null,
        bot: null,
        chat: null,
        lang: defaults.lang
    }
    
    this.set = (data) => {
        this.attributes = Object.assign({}, this.attributes, data)
    }
    
    this.get = () => {
        return this.attributes
    }
    
    this.getInfo = async () => {
        return await MakeRequest('getMe', {}).then((response) => {
            return self.set({bot: response.result})
        })
    }
    
    this.setUser = (data) => {
        currentUser.set(data)
        this.set({user: currentUser})
    }
    
    this.getUser = () => {
        'use strict'
        
        return this.get().user
    }
    
    this.getLang = () => {
        'use strict'
        
        return this.get().lang
    }
    
    this.getChat = () => {
        'use strict'
        
        return this.get().chat
    }
    
    this.getBot = () => {
        'use strict'
        
        return this.get().bot
    }
}

console.log('🔸️  Session model initiated')

let currentSession = new Session()

module.exports.Session = Session
module.exports.currentSession = currentSession