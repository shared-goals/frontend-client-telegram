'use strict'

let MakeRequest = require('../modules/Request').MakeRequest
let currentUser = require('./User').currentUser
let defaults = require('../globals')
let logger = require('../modules/Logger').logger
let i18n = require('../modules/I18n')


/**
 * Класс текущей сессии
 * @constructor
 */
function Session () {
    let self = this
    
    self.attributes = {
        last_message_id: null,
        prev_message_id: null,
        user: null,
        bot: null,
        chat: null,
        lang: defaults.lang
    }
    
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
        if (self.attributes.chat !== null) {
            // self.setUser({telegram_id: self.attributes.chat})
        }
    }
    
    self.get = (key) => {
        return key && typeof key !== 'undefined' ? self.attributes[key] : self.attributes
    }
    
    self.getInfo = async () => {
        return await MakeRequest('getMe', {}).then((response) => {
            return self.set({bot: response.result})
        })
    }
    
    self.setUser = (data) => {
        currentUser.set(data)
        self.set({user: currentUser})
    }
    
    self.getUser = () => {
        'use strict'
        
        return self.get('user')
    }
    
    self.getLang = () => {
        'use strict'
        
        return self.get('lang')
    }
    
    self.getChat = () => {
        'use strict'
        
        return self.get('chat')
    }
    
    self.getBot = () => {
        'use strict'
        
        return self.get('bot')
    }
    
    self.getWebHookInfo = async() => {
        'use strict'
    
        return await MakeRequest('getWebHookInfo', {}).then((response) => {
            return self.set({webhook: response.result})
        })
    }
    
    /**
     * Проверяет текущие значения сессии по хэшу авторизации и SG-объекту пользователя.
     * При их отсутствии делает все необходимые запросы в SGAPI и сетит значения в сессию.
     * @param msg Текущее сообщение от бота
     * @returns {Promise.<TResult>}
     */
    self.checkUser = async(msg) => {
        console.log(msg, self.getChat())
        msg = self.getChat() || msg
        
        // Смотрим текущий хэш в сессии
        let hash = self.get('hash')
        
        // Если его нет или он пустой
        if (hash === null || typeof hash === 'undefined' || hash === '' ) {
            // Посылаем запрос на /login/
            hash = await MakeRequest('login', {
                external: true,
                method: 'POST',
                email: msg.from.username + '@t.me',
                password: "" + msg.from.id
            }).then(async function (response) {
                if (response && response.hasOwnProperty('token')) {
                    logger.info('Сессия авторизована, хэш: ', response.token, `\r\n`)
    
                    // ... значит логин произошел, фиксируем хэш в сессию
                    self.set({hash: response.token})

                    return response.token
                }
            })
        } else {
            logger.info('Сессия авторизована, хэш: ', hash, `\r\n`)
        }
        
        // Если в итоге хэш в сессии есть
        if (typeof hash === 'string' && hash.length > 0) {
            // Запрашиваем объект пользователя из сессии
            let user = self.getUser()
            
            // Если его нет или он не является объектом
            if (user === null || typeof user === 'undefined' || typeof user === 'string') {
                
                // Отправляем запрос на получение информаии о пользователе
                user = await MakeRequest('users/email/' + (msg.from.username || msg.from.id) + '@t.me', {
                    external: true,
                    method: 'GET'
                })
                    .then(async function (response) {
                        let ret
                        
                        // Сетим юзера в сессии
                        self.setUser(response)
                        logger.info('Пользователь определен в сессии: ', self.getUser(), `\r\n`)

                        if (!response.hasOwnProperty('id')) {
                            // Отправляем информацию о регистрации пользователя
                            await MakeRequest('sendMessage', {
                                text: i18n.t('scenes.start.registering_user')
                            })
                            ret = await MakeRequest('register', {
                                external: true,
                                method: 'POST',
                                email: msg.from.username + '@t.me',
                                password: msg.from.id
                            })
                                .then(async(response) => {
                                    session.currentSession.setUser(response)
                                    return await MakeRequest('sendMessage', {
                                        text: i18n.t('scenes.start.user_registered', {username: msg.from.username})
                                    })
                                    
                                })
                        }
                        return ret
                    })
            } else {
                logger.info('Пользователь определен в сессии: ', user, `\r\n`)
            }
            return user
        } else {
            // Иначе что-то не так с логином - шлем в чат информацию об ошибке
            await MakeRequest('sendMessage', {
                text: i18n.t('errors.start.authorization_fail')
            })
            return {}
        }
    }
}

logger.info('🔸️  Session model initiated')

let currentSession = new Session()

module.exports.Session = Session
module.exports.currentSession = currentSession