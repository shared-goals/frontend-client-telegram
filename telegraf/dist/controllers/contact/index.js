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
const keyboards = require("../../util/keyboards")
const _logger = __importDefault(require("../../util/logger"))
const { leave } = Stage.default
const contact = new base_1.default('contact')

contact.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    _logger.default.debug(ctx, 'Enters contact scene')
    const { backKeyboard } = keyboards.getBackKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('scenes.contact.write_to_the_creator'), backKeyboard)
}))

contact.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    _logger.default.debug(ctx, 'Leaves contact scene')
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
}))

contact.command('saveme', leave())

contact.hears(I18n.match('keyboards.back_keyboard.back'), leave())

contact.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield helpers.sendMessage(ctx)
    yield ctx.reply(ctx.i18n.t('scenes.contact.message_delivered'))
}))

exports.default = contact;
