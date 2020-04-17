"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
}

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")
const lodash_1 = require("lodash")
const session = require("../../util/session")

/**
 * Returns main settings keyboard
 */
function getMainKeyboard(ctx) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        m.callbackButton(ctx.i18n.t('scenes.settings.language_button'), JSON.stringify({ a: 'languageSettings' }), false),
        m.callbackButton(ctx.i18n.t('scenes.settings.account_summary_button'), JSON.stringify({ a: 'accountSummary' }), false)
    ], {}))
}

exports.getMainKeyboard = getMainKeyboard

/**
 * Returns language keyboard
 */
function getLanguageKeyboard() {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        m.callbackButton(`English`, JSON.stringify({ a: 'languageChange', p: 'en' }), false),
        m.callbackButton(`Русский`, JSON.stringify({ a: 'languageChange', p: 'ru' }), false)
    ], {}))
}

exports.getLanguageKeyboard = getLanguageKeyboard

/**
 * Returns account summary keyboard
 */
function getAccountSummaryKeyboard(ctx) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        m.callbackButton(ctx.i18n.t('scenes.settings.back_button'), JSON.stringify({ a: 'closeAccountSummary' }), false)
    ], {}))
}

exports.getAccountSummaryKeyboard = getAccountSummaryKeyboard

/**
 * Send message and saving it to the session. Later it can be deleted.
 * Used to avoid messages duplication
 * @param ctx - telegram context
 * @param translationKey - translation key
 * @param extra - extra for the message, e.g. keyboard
 */
function sendMessageToBeDeletedLater(ctx, translationKey, extra) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.webhookReply = false
        const message = yield ctx.reply(ctx.i18n.t(translationKey), extra)
        const messagesToDelete = lodash_1.get(ctx.session, 'settingsScene.messagesToDelete', [])
        session.saveToSession(ctx, 'settingsScene', {
            messagesToDelete: [
                ...messagesToDelete,
                {
                    chatId: message.chat.id,
                    messageId: message.message_id
                }
            ]
        })
    })
}

exports.sendMessageToBeDeletedLater = sendMessageToBeDeletedLater;
