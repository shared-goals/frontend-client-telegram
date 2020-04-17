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
const actions = require("./actions")
const keyboards = require("../../util/keyboards")
const session = require("../../util/session")
const common = require("../../util/common")
const logger = __importDefault(require("../../util/logger"))
const { leave } = Stage.default
const contracts = new baseScene.default('contracts')

// Устанавливаем короткие команды для этого контроллера
actions.setShortcuts({

    '^\\/?(contractView|viewcontract)\\s+(?<params>.+)$': {
        handler: (ctx, text) => {
            logger.default.debug(ctx, 'View contract', text)
            return actions.contractViewAction(ctx, {query: text})
        },
        examples: [
            {cmd: '/viewcontract b334b46f', info: 'Просмотреть информацию о контракте к цели с ID:b334b46f'},
            {cmd: '/viewcontract Bongiozzo/sgfriends', info: 'Просмотреть информацию о контракте к цели пользователя Bongiozzo с кодом "sgfriends"'}
        ]
    },

    '^\\/?contracts': {
        handler: (ctx, text) => {
            logger.default.debug(ctx, 'View contracts list', text)
            return actions.contractsListViewAction(ctx, {query: text})
        },
        examples: [
            {cmd: '/contracts', info: 'Список контрактов'}
        ]
    },
    
    '^\\/?commit\\s+(?<params>.+)$': {
        handler: async(ctx, text) => __awaiter(void 0, void 0, void 0, function* () {
            logger.default.debug(ctx, 'Set new commit:', text)
            return yield actions.newCommitViewAction(ctx, {query: text})
        }),
        examples: [
            {cmd: '/commit 5e934444 90min "сделал раз" "сделать два"', info: 'Записать коммит длительностью 1.5 часа по цели с идентификатором 5e934444, установить текст о проделанной работе "сделал раз" и текст о том, что делать дальше - "сделать два"'},
            {cmd: '/commit someuser/myfirstgoal 2h 30min "сделал короткую команду"', info: 'Записать коммит длительностью 2.5 часа по цели пользователя someuser с кодом "myfirstgoal", установить текст о проделанной работе "сделал короткую команду"'},
            {cmd: '/commit me/sg 4h "доделал всё"', info: 'Записать коммит длительностью 4 часа по своей собственной цели с кодом "sg", установить текст о проделанной работе "доделал всё"'}
        ]
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
contracts.action(/setCommit/, actions.newCommitViewAction)
contracts.action(/newCommitSubmit/, actions.newCommitSubmit)

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

// Обработка нажатий на кнопки, после которых должны быть инициированы вводы с клавиатуры
contracts.action(/.+/, actions.newGoalAnyButtonAction)

// contracts.command('saveme', leave())
contracts.command('leave', leave())

logger.default.debug(undefined, '🔹️  Contracts controller initiated')

exports.default = contracts;
