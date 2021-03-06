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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const helpers = require("./helpers")
const language = require("../../util/language")
const keyboards = require("../../util/keyboards")
const session = require("../../util/session")

exports.languageSettingsAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.editMessageText(ctx.i18n.t('scenes.settings.pick_language'), helpers.getLanguageKeyboard())
})

exports.languageChangeAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const langData = JSON.parse(ctx.callbackQuery.data)
    yield language.updateLanguage(ctx, langData.p)
    const { backKeyboard } = keyboards.getBackKeyboard(ctx)
    for (const msg of ctx.session.settingsScene.messagesToDelete) {
        yield ctx.telegram.deleteMessage(msg.chatId, msg.messageId)
    }
    session.deleteFromSession(ctx, 'settingsScene')
    yield helpers.sendMessageToBeDeletedLater(ctx, 'scenes.settings.language_changed', helpers.getMainKeyboard(ctx))
    yield helpers.sendMessageToBeDeletedLater(ctx, 'scenes.settings.what_to_change', backKeyboard)
})
