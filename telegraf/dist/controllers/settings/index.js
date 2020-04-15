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
const baseScene = __importDefault(require("telegraf/scenes/base"))
const helpers = require("./helpers")
const actions = require("./actions")
const keyboards = require("../../util/keyboards")
const session = require("../../util/session")
const logger = __importDefault(require("../../util/logger"))
const { leave } = Stage.default
const settings = new baseScene.default('settings')

settings.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Enters settings scene')
    const { backKeyboard } = keyboards.getBackKeyboard(ctx)
    session.deleteFromSession(ctx, 'settingsScene')
    yield helpers.sendMessageToBeDeletedLater(ctx, 'scenes.settings.what_to_change', helpers.getMainKeyboard(ctx))
    yield helpers.sendMessageToBeDeletedLater(ctx, 'scenes.settings.settings', backKeyboard)
}))

settings.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Leaves settings scene')
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
    session.deleteFromSession(ctx, 'settingsScene')
}))

settings.command('saveme', leave())

settings.hears(I18n.match('keyboards.back_keyboard.back'), leave())

settings.action(/languageSettings/, actions.languageSettingsAction)
settings.action(/languageChange/, actions.languageChangeAction)

logger.default.debug(undefined, '🔹️  Settings controller initiated')

exports.default = settings;
