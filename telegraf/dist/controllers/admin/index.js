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

const Stage = __importDefault(require("telegraf/stage"))
const baseScene = __importDefault(require("telegraf/scenes/base"))
const I18n = require("telegraf-i18n")
const keyboards = require("../../util/keyboards")
const session = __importDefault(require("../../util/session"))
const common = __importDefault(require("../../util/common"))
const logger = __importDefault(require("../../util/logger"))
const actions = __importDefault(require("./actions"))
const helpers = require("./helpers")
const { leave } = Stage.default
const admin = new baseScene.default('admin')

admin.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Enters admin scene')
    const { backKeyboard } = keyboards.getBackKeyboard(ctx)
    session.deleteFromSession(ctx, 'adminScene')
    if (ctx.session.silentSceneChange !== true) {
        yield common.sendMessageToBeDeletedLater(ctx, 'admin', 'scenes.admin.welcome_text', helpers.getInitKeyboard(ctx))
    }
    session.deleteFromSession(ctx, 'silentSceneChange')
    yield common.sendMessageToBeDeletedLater(ctx, 'admin', '', backKeyboard)

}))

admin.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Leaves admin scene')
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
}))

admin.action(/checkTranslations/, actions.checkTranslationsAction)

admin.command('saveme', leave())
admin.hears(I18n.match('keyboards.back_keyboard.back'), leave())

admin.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const [type, ...params] = ctx.message.text.split(' | ')
    switch (type) {
        case 'write':
            yield helpers.write(ctx, params[0], params[1])
            break;
        case 'stats':
            yield helpers.getStats(ctx)
            break;
        case 'help':
            yield helpers.getHelp(ctx)
            break;
        default:
            ctx.reply('Command was not specified')
    }
}))

logger.default.debug(undefined, '🔹️  Admin controller initiated')

exports.default = admin;
