'use strict'

require('dotenv').config()

let session = require('../models/Session')
let scenes = require('../modules/Scenes')
let MakeRequest = require('../modules/Request').MakeRequest
let i18n = require('../modules/I18n')


/**
 * Обработчик кнопки Начало (/start)
 */
async function startHandler (msg) {
    let opt = {
        external: true,
        method: 'POST',
        email: msg.from.username + '@t.me',
        password: "" + msg.from.id
    }
    
    return await MakeRequest('login', opt)
        .then(async function (response) {
            if (response && response.hasOwnProperty('token')) {
                session.currentSession.set({hash: response.token})
            }
            return true
        })
        .then(async function () {
            MakeRequest('sendMessage', {
                text: i18n.t('scenes.start.fetching_user')
            })
        })
        .then(async function () {
            opt = {
                external: true,
                method: 'GET'
            }
            return await MakeRequest('users/email/' + (msg.from.username || msg.from.id) + '@t.me', opt)
                .then(async function (response) {
                    let ret
                    session.currentSession.setUser(response)
                    if (!response.hasOwnProperty('id')) {
                        MakeRequest('sendMessage', {
                            text: i18n.t('scenes.start.registering_user')
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
                                    text: i18n.t('scenes.start.user_registered', {username: msg.from.username})
                                })
                                return scenes.all.get('welcome')
                            })
                    } else {
                        ret = scenes.all.get('welcome')
                    }
                    return ret
                })
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
    text: i18n.t('scenes.start.welcome_text'),
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
