'use strict'

require('dotenv').config()

module.exports = {
    updateCounter: 0,
    logErrors: false,
    TGAPI: `https://api.telegram.org/bot${process.env.BOT_TOKEN}`
}