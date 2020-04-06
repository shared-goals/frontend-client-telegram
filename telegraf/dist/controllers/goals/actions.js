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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const helpers = require("./helpers")
const logger = __importDefault(require("../../util/logger"))
const session = __importDefault(require("../../util/session"))
const Goal = require("../../models/Goal")
const req = __importDefault(require("../../util/req"))

/**
 *
 * @param ctx
 */
const newGoalCreateAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const newGoalCreateKeyboard = helpers.newGoalCreateKeyboard(ctx)
    newGoalCreateKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.goals.create_new.welcome_text'), newGoalCreateKeyboard)
})

exports.newGoalCreateAction = newGoalCreateAction

/**
 *
 * @param ctx
 */
exports.goalsListViewAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.fetching'))
    
    const goals = yield req.make(ctx, 'users/' + ctx.session.SGUser.id + '/goals', {
        method: 'GET'
    }).then(async (response) => {
        const goals = response

        await goals.forEach(async(goal) => {
            goal.contract = await req.make(ctx, `goals/${goal.id}/contract`, {
                method: 'GET'
            }).then((response) => {
                return Object.assign({}, response, {string: helpers.stringifyOccupation(response)})
            })
        })
        
        return goals
    })
    
    yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.welcome_text'))
    
    const goalsListKeyboard = helpers.goalsListKeyboard(ctx, goals)
    goalsListKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.goals.your_goals'), goalsListKeyboard)
})

/**
 *
 * @param ctx
 */
exports.goalViewAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const data = JSON.parse(ctx.callbackQuery.data)
    const goal = yield (new Goal.default()).findById(ctx, data.p).then((g) => {return g})
    
    const goalViewKeyboard = helpers.goalViewKeyboard(ctx, goal)
    goalViewKeyboard.disable_web_page_preview = true

    yield ctx.replyWithHTML(
        `<i>Наименование:</i>\r\n    <b>${goal.get('title')}</b>`
        + `\r\n<i>Текст:</i>\r\n    ${goal.get('text')}`
        + `\r\n<i>Контракт:</i>\r\n    ${goal.get('contract').string}`,
        goalViewKeyboard
    )
})

/**
 *
 * @param ctx
 */
exports.newGoalAnyButtonAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!ctx.session.newGoalId || typeof ctx.session.newGoalId === 'undefined') {
        const newGoals = ctx.session.newGoals || {}
        session.saveToSession(ctx, 'newGoalId', Math.round(Math.random() * 1000000))
        newGoals[ctx.session.newGoalId] = new Goal.default()
        session.saveToSession(ctx, 'newGoals', newGoals)
    }
    
    switch (ctx.callbackQuery && ctx.callbackQuery.data) {
        case 'setNewGoalTitle': {
            ctx.reply(ctx.i18n.t('scenes.goals.set_title.text'))
            ctx.session.state = 'enterNewGoalTitle'
            break
        }
        case 'setNewGoalDescription': {
            ctx.reply(ctx.i18n.t('scenes.goals.set_description.text'))
            ctx.session.state = 'enterNewGoalDescription'
            break
        }
        case 'setNewGoalOccupation': {
            ctx.reply(ctx.i18n.t('scenes.goals.set_occupation.text'))
            ctx.session.state = 'enterNewGoalOccupation'
            break
        }
    }
})

/**
 *
 * @param ctx
 */
exports.newGoalAnyButtonHandler = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const newGoals = ctx.session.newGoals
    if (!newGoals || typeof newGoals === 'undefined') {
        return
    }
    switch (ctx.session.state) {
        case 'enterNewGoalTitle': {
            logger.default.debug(ctx, 'Setting new goal title to', ctx.match.input)
            newGoals[ctx.session.newGoalId].set({title: ctx.match.input})
            session.saveToSession(ctx, 'newGoals', newGoals)
            break
        }
        case 'enterNewGoalDescription': {
            logger.default.debug(ctx, 'Setting new goal description to', ctx.match.input)
            newGoals[ctx.session.newGoalId].set({text: ctx.match.input})
            session.saveToSession(ctx, 'newGoals', newGoals)
            break
        }
        case 'enterNewGoalOccupation': {
            logger.default.debug(ctx, 'Setting new goal occupation to', ctx.match.input)
    
            let contract = newGoals[ctx.session.newGoalId].get('contract')
            
            // Валидируем введенную строку
            let correct = helpers.validateOccupationFormat(ctx, ctx.match.input)
            contract.set(correct)
            contract.set({occupation: ctx.match.input})
    
            newGoals[ctx.session.newGoalId].set({contract: contract})
            session.saveToSession(ctx, 'newGoals', newGoals)
            break
        }
    }
    console.log(JSON.stringify(ctx.session.newGoals[ctx.session.newGoalId].toJSON()))
    
    newGoalCreateAction(ctx)
});