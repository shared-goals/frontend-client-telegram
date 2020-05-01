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
const actions = require("./actions")
const helpers = require("./helpers")
const logger = __importDefault(require("../../util/logger"))

const session = __importDefault(require("../../util/session"))
const keyboards = require("../../util/keyboards")

const { leave } = Stage.default
const start = new baseScene.default('start')

start.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    if (session.user) {
        yield ctx.reply(ctx.i18n.t('scenes.start.welcome_back'), mainKeyboard)
    }
    else {
        yield ctx.reply('Choose language / Выбери язык', helpers.getLanguageKeyboard())
    }
}))

start.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
}))

start.command('saveme', leave())

start.action(/languageChange/, actions.languageChangeAction)

start.action(/confirmAccount/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.answerCbQuery()
    ctx.scene.leave()
}))

logger.default.debug(undefined, '🔹️  Start controller initiated')

exports.default = start;
