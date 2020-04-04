"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")

/**
 * Displays menu with a list of movies
 * @param movies - list of movies
 */
/**
 * Returns language keyboard
 */
function getLanguageKeyboard() {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        m.callbackButton(`English`, JSON.stringify({ a: 'languageChange', p: 'en' }), false),
        m.callbackButton(`Русский`, JSON.stringify({ a: 'languageChange', p: 'ru' }), false)
    ], {}));
}

exports.getLanguageKeyboard = getLanguageKeyboard

/**
 * Returns button that user has to click to start working with the bot
 */
function getAccountConfirmKeyboard(ctx) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        m.callbackButton(ctx.i18n.t('scenes.start.lets_go'), JSON.stringify({ a: 'confirmAccount' }), false)
    ], {}));
}

exports.getAccountConfirmKeyboard = getAccountConfirmKeyboard;
