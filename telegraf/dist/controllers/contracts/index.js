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
const common = require("../../util/common")
const logger = __importDefault(require("../../util/logger"))
const { leave } = Stage.default
const contracts = new baseScene.default('contracts')
exports.shortCommands = ['contract']

// Устанавливаем короткие команды для этого контроллера
actions.setShortcuts({
    // '^\\/?contract': {
    //     handler: (ctx, text) => {
    //         logger.default.debug(ctx, 'View or edit contract')
    //         return actions.contractViewAction(ctx, {query: text})
    //     }
    // },
    '^\\/?(contractView|viewcontract)\\s+.+': {
        handler: (ctx, text) => {
            logger.default.debug(ctx, 'View contract', text)
            return actions.contractViewAction(ctx, {query: text})
        }
    },

    // Комманды /contracts - список контрактов
    '^\\/?contracts': {
        handler: (ctx, text) => {
            logger.default.debug(ctx, 'View contracts list', text)
            return actions.contractsListViewAction(ctx, {query: text})
        }
    }
    
})

// Инициализация сцены
contracts.enter((ctx, state, silent) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Enters contracts scene')
    const { backKeyboard } = keyboards.getBackKeyboard(ctx)
    session.deleteFromSession(ctx, 'contractsScene')
    if (ctx.session.silentSceneChange !== true) {
        yield actions.contractsListViewAction(ctx)
    }
    session.deleteFromSession(ctx, 'silentSceneChange')
    yield common.sendMessageToBeDeletedLater(ctx, 'contracts', '', backKeyboard)
}))

// Основные "кнопочные" переходы
contracts.action(/contractsListView/, actions.contractsListViewAction)
contracts.action(/editContract/, actions.editContractAction)
contracts.action(/contractView/, actions.contractViewAction)

// Уход со цены
contracts.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Leaves contracts scene')
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
    session.deleteFromSession(ctx, 'contractsScene')
}))

// Кнопка "Назад" в основном меню с обработчиком - уходом со сцены
contracts.hears(I18n.match('keyboards.back_keyboard.back'), leave())

// Обработка произвольных вводов с клавиатуры
contracts.hears(/.+/, actions.defaultHandler)

// contracts.command('saveme', leave())
contracts.command('leave', leave())

logger.default.debug(undefined, '🔹️  Contracts controller initiated')

exports.default = contracts;
