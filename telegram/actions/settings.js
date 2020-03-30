'use strict'

require('dotenv').config()

let msgActions = require('../modules/MsgActions').msgActions


// Settings from subs to parent
msgActions.set({
    id: 'changeLanguage',
    key: `🇷🇺 Change language`,
    text: `🇷🇺 Change language`,
    callback_data:'chLang'
})

msgActions.set({
    id: 'chLang',
    key: `🇷🇺 Select language`,
    text: `🇷🇺 Select language`,
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                {text: `🇬🇧 English`, callback_data:'en'},
                {text: `🇷🇺 Русский`, callback_data:'ru'}
            ], [
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})

msgActions.set({
    id: 'settings',
    key: '🛠 Settings',
    text: 'Select Settings below',
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                msgActions.get('changeLanguage')
            ], [
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})
