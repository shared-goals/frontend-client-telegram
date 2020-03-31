'use strict'

require('dotenv').config()

let scenes = require('../modules/Scenes')


// Settings from subs to parent
scenes.all.set({
    id: 'changeLanguage',
    key: `🇷🇺 Change language`,
    text: `🇷🇺 Change language`,
    callback_data:'chLang'
})

scenes.all.set({
    id: 'chLang',
    key: `🇷🇺 Select language`,
    text: `🇷🇺 Select language`,
    reply_markup: {
        inline_keyboard: [
            [
                {text: `🇬🇧 English`, callback_data:'en'},
                {text: `🇷🇺 Русский`, callback_data:'ru'}
            ], [
                {id: 'welcome', text: `⬅️ Back`}
            ]
        ]
    }
})

scenes.all.set({
    id: 'settings',
    key: '🛠 Settings',
    text: 'Select Settings below',
    reply_markup: {
        inline_keyboard: [
            [
                {id: 'changeLanguage'}
            ], [
                {id: 'welcome', text: `⬅️ Back`}
            ]
        ]
    }
})
