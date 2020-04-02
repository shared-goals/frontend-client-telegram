'use strict'

require('dotenv').config()

module.exports = {
    lang: 'ru',
    host: `${process.env.HOST}`,
    port: `${process.env.PORT}`,
    www: {
        host: `${process.env.WWWHOST}`,
        port: `${process.env.WWWPORT}`,
    },
    updateCounter: 0,
    log: true,
    icons: {
        check: {
            empty: '⭕ ',
            checked: '✅ '
        }
    },
    weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    TGAPI: `https://api.telegram.org/bot${process.env.BOT_TOKEN}`,
    SGAPI: `http://127.0.0.1:3030`
}