'use strict'

require('dotenv').config()

let currentUser = require('../modules/User').currentUser
let msgActions = require('../modules/MsgActions').msgActions
let MakeRequest = require('../modules/Common').MakeRequest


/**
 * Обработчик кнопки Начало (/start)
 */
async function startHandler (msg) {
    let opt = {
        chat_id: msg.from.id,
        external: true,
        method: 'GET'
    }
    MakeRequest('sendMessage', {
        chat_id: msg.from.id,
        text: 'Getting user data...'
    })
    return await MakeRequest('users/email/' + (msg.from.username || msg.from.id) + '@t.me', opt)
        .then(async function (response) {
            let ret, action
            currentUser.set(response)
            if (!response.hasOwnProperty('id')) {
                MakeRequest('sendMessage', {
                    chat_id: msg.from.id,
                    text: 'Registering user...'
                })
                let opt = {
                    chat_id: msg.from.id,
                    external: true,
                    method: 'POST',
                    email: msg.from.username + '@t.me',
                    password: msg.from.id
                }
                ret = await MakeRequest('register', opt)
                    .then((response) => {
                        currentUser.set(response)
                        MakeRequest('sendMessage', {
                            chat_id: msg.from.id,
                            text: 'User ' + msg.from.username + ' registered...'
                        })
                        action = msgActions.get('welcome')
                        action.chat_id = msg.from.id
                        // makeRequest('sendMessage', action)
                        return action
                    })
            } else {
                action = msgActions.get('welcome')
                action.chat_id = msg.from.id
                // makeRequest('sendMessage', action)
                ret = action
            }
            return ret
        })
}

// назначаем интерфейнсные скрины / кнопки
msgActions.set({
    id: 'start',
    key: 'start',
    callback_data: startHandler
})

msgActions.set({
    id: 'welcome',
    key: 'welcome',
    text: 'Welcome to SharedGoals service.',
    reply_markup: JSON.stringify({
        keyboard: [
            [
                {text: `🧰 Goals`, callback_data: 'goals'},
                {text: `🛠 Settings`}
            ]
        ],
        resize_keyboard: true
    })
})
