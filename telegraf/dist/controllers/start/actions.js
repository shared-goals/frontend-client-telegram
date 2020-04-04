"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    });
}

Object.defineProperty(exports, "__esModule", { value: true })

const helpers = require("./helpers")
const common = require("../../util/common")
const language_1 = require("../../util/language")

exports.languageChangeAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const langData = JSON.parse(ctx.callbackQuery.data)
    yield language_1.updateLanguage(ctx, langData.p)
    const accountConfirmKeyboard = helpers.getAccountConfirmKeyboard(ctx)
    accountConfirmKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.start.new_account'))
    // yield common.sleep(3)
    yield ctx.reply(ctx.i18n.t('scenes.start.bot_description'), accountConfirmKeyboard)
    yield ctx.answerCbQuery()
});
