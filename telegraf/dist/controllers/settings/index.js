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

const I18n = require("telegraf-i18n")
const Stage = __importDefault(require("telegraf/stage"))
const base_1 = __importDefault(require("telegraf/scenes/base"))
const helpers = require("./helpers")
const actions_1 = require("./actions")
const keyboards_1 = require("../../util/keyboards")
const session = require("../../util/session")
const _logger = __importDefault(require("../../util/logger"))
const { leave } = Stage.default
const settings = new base_1.default('settings')

settings.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    _logger.default.debug(ctx, 'Enters settings scene')
    const { backKeyboard } = keyboards_1.getBackKeyboard(ctx)
    session.deleteFromSession(ctx, 'settingsScene')
    yield helpers.sendMessageToBeDeletedLater(ctx, 'scenes.settings.what_to_change', helpers.getMainKeyboard(ctx))
    yield helpers.sendMessageToBeDeletedLater(ctx, 'scenes.settings.settings', backKeyboard)
}))

settings.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    _logger.default.debug(ctx, 'Leaves settings scene')
    const { mainKeyboard } = keyboards_1.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
    session.deleteFromSession(ctx, 'settingsScene')
}))

settings.command('saveme', leave())

settings.hears(I18n.match('keyboards.back_keyboard.back'), leave())

settings.action(/languageSettings/, actions_1.languageSettingsAction)

settings.action(/languageChange/, actions_1.languageChangeAction)

settings.action(/accountSummary/, actions_1.accountSummaryAction)

settings.action(/closeAccountSummary/, actions_1.closeAccountSummaryAction)

exports.default = settings;
