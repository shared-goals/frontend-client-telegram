'use strict'

require('dotenv').config()

let session = require('../models/Session')
let scenes = require('../modules/Scenes')
let MakeRequest = require('../modules/Request').MakeRequest


/**
 * Обработчик кнопки Начало (/start)
 */
async function startHandler (msg) {
    let opt = {
        external: true,
        method: 'GET'
    }
    MakeRequest('sendMessage', {
        text: 'Getting user data...'
    })
    return await MakeRequest('users/email/' + (msg.from.username || msg.from.id) + '@t.me', opt)
        .then(async function (response) {
            let ret
            session.currentSession.setUser(response)
            if (!response.hasOwnProperty('id')) {
                MakeRequest('sendMessage', {
                    text: 'Registering user...'
                })
                let opt = {
                    external: true,
                    method: 'POST',
                    email: msg.from.username + '@t.me',
                    password: msg.from.id
                }
                ret = await MakeRequest('register', opt)
                    .then((response) => {
                        session.currentSession.setUser(response)
                        MakeRequest('sendMessage', {
                            text: 'User ' + msg.from.username + ' registered...'
                        })
                        return scenes.all.get('welcome')
                    })
            } else {
                ret = scenes.all.get('welcome')
            }
            return ret
        })
}

// назначаем интерфейнсные скрины / кнопки
scenes.all.set({
    id: 'start',
    key: 'start',
    callback_data: startHandler
})

scenes.all.set({
    id: 'welcome',
    key: 'welcome',
    text: 'Welcome to SharedGoals service.',
    reply_markup: {
        keyboard: [
            [
                {id: 'goals', use: 'key'},
                {id: 'settings', use: 'key'}
            ]
        ],
        resize_keyboard: true
    }
})
