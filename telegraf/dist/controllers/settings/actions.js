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
const logger = __importDefault(require("../../util/logger"))
const User_1 = __importDefault(require("../../models/User"))
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

exports.accountSummaryAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Checking account summary')
    const user = yield User_1.default.findById(ctx.from.id)
    yield ctx.editMessageText(ctx.i18n.t('scenes.settings.account_summary', {
        username: user.username,
        id: user._id,
        totalMovies: user.totalMovies,
        version: process.env.npm_package_version
    }), helpers.getAccountSummaryKeyboard(ctx))
    yield ctx.answerCbQuery()
})

exports.closeAccountSummaryAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.editMessageText(ctx.i18n.t('scenes.settings.what_to_change'), helpers.getMainKeyboard(ctx))
    yield ctx.answerCbQuery()
});
