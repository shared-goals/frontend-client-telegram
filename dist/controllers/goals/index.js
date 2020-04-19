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
const goals = new baseScene.default('goals')

// Устанавливаем короткие команды для этого контроллера
actions.setShortcuts({

    '^\\/?(viewgoal|goalView)\\s*(?<params>.+)$': {
        handler: (ctx, text) => {
            const params = text.match(/^\/?(viewgoal|goalView)\s*(?<params>.+)$/)
            logger.default.debug(ctx, 'View goal', text)
            return actions.goalViewAction(ctx, text)
        },
        examples: [
            {cmd: '/viewgoal b334b46f', info: 'Просмотреть информацию о цели с ID:b334b46f'}
        ]
    },

    '^\\/?newgoal': {
        handler: (ctx) => {
            logger.default.debug(ctx, 'New goal')
            return actions.newGoalViewAction(ctx)
        },
        examples: [
            {cmd: '/newgoal', info: 'Перейти к созданию новой цели'}
        ]
    },

    '^\\/?editgoals': {
        handler: (ctx, text) => {
            logger.default.debug(ctx, 'View or edit goal')
            return actions.goalsListViewAction(ctx, {query: text})
        },
        examples: [
            {cmd: '/editgoals', info: 'Перейти к списку своих целей'}
        ]
    },
    
    '^\\/?contract\\s+(?<params>.+)$': {
        handler: async(ctx, text) => __awaiter(void 0, void 0, void 0, function* () {
            logger.default.debug(ctx, 'Join goal', text)
            return yield actions.joinGoalAction(ctx, {query: text})
        }),
        examples: [
            {cmd: '/contract ewgeniyk/sg 4h every sat,sun', info: 'Присоединиться к цели с кодом "sg" пользователя ewgeniyk, установив контракт "4 часа каждые субботу и воскресенье"'}
        ]
    }
})


goals.enter((ctx, state, silent) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Enters goals scene')
    const { backKeyboard } = keyboards.getBackKeyboard(ctx)
    session.deleteFromSession(ctx, 'goalsScene')
    if (ctx.session.silentSceneChange !== true) {
        yield common.sendMessageToBeDeletedLater(ctx, 'goals', 'scenes.goals.welcome_text', helpers.getInitKeyboard(ctx))
    }
    session.deleteFromSession(ctx, 'silentSceneChange')
    // yield common.sendMessageToBeDeletedLater(ctx, 'scenes.goals.welcome_more_text')
    yield common.sendMessageToBeDeletedLater(ctx, 'goals', '', backKeyboard)
}))

goals.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    logger.default.debug(ctx, 'Leaves goals scene')
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
    session.deleteFromSession(ctx, 'goalsScene')
    session.deleteFromSession(ctx, 'newCommitId')
    session.deleteFromSession(ctx, 'commits')
}))

goals.action(/newGoalView/, actions.newGoalViewAction)
goals.action(/goalsListView/, actions.goalsListViewAction)
goals.action(/editContract/, actions.editContractAction)
goals.action(/goalView/, actions.goalViewAction)
goals.action(/newGoalSubmit/, actions.newGoalSubmit)

const contractsActions = require('../contracts/actions')
goals.action(/setCommit/, contractsActions.newCommitViewAction)

goals.hears('goalView.+', actions.goalViewAction)

// Обработка нажатий на кнопки, после которых должны быть инициированы вводы с клавиатуры
goals.action(/.+/, actions.newGoalAnyButtonAction)

goals.hears(I18n.match('keyboards.back_keyboard.back'), leave())

// Обработка обычных вводов с клавиатуры
goals.hears(/.+/, actions.defaultHandler)

// goals.command('saveme', leave())
goals.command('leave', leave())


logger.default.debug(undefined, '🔹️  Goals controller initiated')

exports.default = goals;
