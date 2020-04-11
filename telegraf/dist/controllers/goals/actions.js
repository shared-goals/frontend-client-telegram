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
const User = require("../../models/User")
const req = __importDefault(require("../../util/req"))

/**
 *
 * @param ctx
 */
const newGoalViewAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const newGoalViewKeyboard = helpers.newGoalViewKeyboard(ctx)
    newGoalViewKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.goals.create_new.welcome_text'), newGoalViewKeyboard)
})

exports.newGoalViewAction = newGoalViewAction

/**
 *
 * @param ctx
 */
const goalsListViewAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.fetching'))
    
    let goals = yield req.make(ctx, 'users/' + ctx.session.SGUser.get('id') + '/goals', {
        method: 'GET'
    }).then(async (response) => {
        const goals = response

        await goals.forEach(async(goal) => {
            goal.contract = await req.make(ctx, `goals/${goal.id}/contract`, {
                method: 'GET'
            }).then((response) => {
                return Object.assign({}, response, {string: helpers.stringifyContract(response)})
            })
        })
        
        return goals
    })
    
    // конвертируем записи в объекты
    goals = goals.map((goal) => (new Goal.default()).set(goal))
    
    const goalsListKeyboard = helpers.goalsListKeyboard(ctx, goals)
    goalsListKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.welcome_text'), goalsListKeyboard)
})

exports.goalsListViewAction = goalsListViewAction

/**
 *
 * @param ctx
 */
const goalViewAction = async(ctx, goalId) => __awaiter(void 0, void 0, void 0, function* () {
    let data = (typeof goalId).toLowerCase() === 'string'
        ? {p: goalId} : (ctx.callbackQuery ? JSON.parse(ctx.callbackQuery.data) : null)

    if (data !== null) {
        const goal = yield (new Goal.default()).findById(ctx, data.p).then((g) => {return g})
        
        let owner = ctx.session.SGUser
        const isMyGoal = (owner.get('id') === goal.get('owner').id)
        
        const keyboard = isMyGoal ? helpers.goalMyViewKeyboard(ctx, goal) : helpers.goalAnyViewKeyboard(ctx, goal)
        keyboard.disable_web_page_preview = true
        
        if (!isMyGoal) {
            owner = yield (new User.default()).findById(ctx, goal.get('owner').id).then((g) => {return g})
        }
    
        yield ctx.replyWithHTML(
            `<i>Наименование:</i>\r\n    <b>${goal.get('title')}</b>`
            + `\r\n<i>Текст:</i>\r\n    ${goal.get('text')}`
            + (isMyGoal ? '' : `\r\n<i>Автор:</i>\r\n    ${owner.get('email').replace(/@.+$/, '')}`)
        )
    
        yield ctx.reply('Действия:', keyboard)
    } else {
        logger.default.error('Error setting goal id')
        yield ctx.reply('Ошибка задания номер цели')
    }
})
exports.goalViewAction = goalViewAction

/**
 *
 * @param ctx
 */
exports.newGoalAnyButtonAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let goals = null
    if (!ctx.session.newGoalId || typeof ctx.session.newGoalId === 'undefined') {
        goals = ctx.session.goals || {}
        session.saveToSession(ctx, 'newGoalId', Math.round(Math.random() * 1000000))
        goals[ctx.session.newGoalId] = yield (new Goal.default())
        session.saveToSession(ctx, 'goals', goals)
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
        case 'setNewGoalContract': {
            editContractAction(ctx, goals ? goals[ctx.session.newGoalId] : null)
            break
        }
    }
})

/**
 *
 * @param ctx
 * @param goal
 */
const editContractAction = async(ctx, goal) => __awaiter(void 0, void 0, void 0, function* () {
    let data = null
    if ((typeof goal).toLowerCase() === 'string') {
        data = {p: goal}
    } else if (ctx.callbackQuery) {
        if (ctx.callbackQuery.data.match(/^\{.*\}$/)) {
            try {
                data = JSON.parse(ctx.callbackQuery.data)
            } catch (e) {
                console.error(e)
            }
        }
    }
    
    if (data !== null) {
        goal = yield (new Goal.default()).findById(ctx, data.p)
        ctx.session.updatingGoalId = goal.get('id')
        ctx.session.state = 'enterUpdatingGoalContract'
    } else {
        ctx.session.state = 'enterNewGoalContract'
    }
    let currentContract = null
    
    if (goal !== null) {
        currentContract = goal.get('contract').toString()
    }

    ctx.replyWithHTML(`Текущий контракт: <code>${currentContract || 'не определен'}</code>\r\n\r\n` + ctx.i18n.t('scenes.goals.set_occupation.text'))
})

exports.editContractAction = editContractAction

/**
 *
 * @param ctx
 * @param goal
 */
const setContractInGoalObject = async(ctx, goal, text) => __awaiter(void 0, void 0, void 0, function* () {
    // Валидируем введенную строку
    let correct = helpers.validateContractFormat(ctx, text)

    if (correct !== null) {
        logger.default.debug(ctx, 'Setting new goal occupation to', text)
    
        let contract = goal.get('contract')
        contract.set(correct)
        contract.set({occupation: text})
    
        goal.set({contract: contract})
    
        goal.get('contract').updateReadyState(ctx)
        goal.updateReadyState(ctx)
    
        const currentGoals = ctx.session.goals
        if (currentGoals) {
            currentGoals[ctx.session.newGoalId] = goal
            session.saveToSession(ctx, 'goals', currentGoals)
        }
        
        return true
    } else {
        logger.default.error(ctx, 'Error setting new goal occupation. Parse error:', text)

        yield ctx.reply('Некорректное значение параметра занятости')
        
        return false
    }
})

/**
 *
 * @param ctx
 */
exports.defaultHandler = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.match.input
    logger.default.debug(ctx, 'Goals default Handler:', text)
    
    switch (true) {

        // Если ввели в консоли /viewgoal XX или /goalView XX - идем в просмотр цели
        case text.match(/^\/?(viewgoal|goalView)\s*\d+$/) !== null: {
            const params = text.match(/^\/?(viewgoal|goalView)\s*(\d+)$/)
            logger.default.debug(ctx, 'View goal', params[2])
            return goalViewAction(ctx, params[2])
        }
    
        // Если ввели в консоли /newgoal - идем в форму создания новой цели
        case text.match(/^\/?newgoal/) !== null: {
            logger.default.debug(ctx, 'New goal')
            return newGoalViewAction(ctx)
        }
    
        // Если ввели в консоли /newgoal - идем в форму создания новой цели
        case text.match(/^\/?editgoals/) !== null: {
            logger.default.debug(ctx, 'List and edit goals')
            return goalsListViewAction(ctx)
        }
    
        // остальные введенные строки
        default: {
            
            logger.default.debug(ctx, 'Короткие команды не распознаны, определяем состояние: ', ctx.session.state)
            
            let goal = null
            let currentGoals = null
            if (ctx.session.state.match(/NewGoal/)) {
                currentGoals = ctx.session.goals
                goal = currentGoals[ctx.session.newGoalId]
            } else if (ctx.session.state.match(/UpdatingGoal/)) {
                goal = yield (new Goal.default()).findById(ctx, ctx.session.updatingGoalId)
            }
            if (!goal) {
                logger.default.debug(ctx, 'Ошибка определения объекта цели')
            }
            switch (ctx.session.state) {

                // Ввод параметров для апдейта существующей цели

                case 'enterUpdatingGoalContract': {
                    const ret = yield setContractInGoalObject(ctx, goal, text)
                    if (ret !== false) {
                        goal.get('contract').save(ctx)
                        yield ctx.reply('Данные контракта сохранены')
                    }
                    break
                }
    
                // Ввод параметров для добавления новой цели

                case 'enterNewGoalTitle': {
                    logger.default.debug(ctx, 'Setting new goal title to', text)
                    goal.set({title: text})
                    goal.updateReadyState(ctx)
                    if (goal !== false) {
                        currentGoals[ctx.session.newGoalId] = goal
                        session.saveToSession(ctx, 'goals', currentGoals)
                    }
    
                    newGoalViewAction(ctx)
                    break
                }
                case 'enterNewGoalDescription': {
                    logger.default.debug(ctx, 'Setting new goal description to', text)
                    goal.set({text: text})
                    goal.updateReadyState(ctx)
                    if (goal !== false) {
                        currentGoals[ctx.session.newGoalId] = goal
                        session.saveToSession(ctx, 'goals', currentGoals)
                    }
    
                    newGoalViewAction(ctx)
                    break
                }
                case 'enterNewGoalContract': {
                    yield setContractInGoalObject(ctx, goal, text)
    
                    // Снова показываем форму вводимых параметров цели
                    newGoalViewAction(ctx)
                    break
                }
            }
        }
    }
})

exports.newGoalSubmit = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let newGoal
    
    if (typeof ctx.session.newGoalId !== 'undefined' && typeof ctx.session.goals !== 'undefined') {
        newGoal = ctx.session.goals[ctx.session.newGoalId]
    }
    
    if (!newGoal) {
        logger.default.error('new goal object isn\'t defined')
        ctx.reply('Цель не задана')
        return null
    }
    
    newGoal.updateReadyState(ctx)

    if (newGoal.get('ready') !== true) {
        logger.default.error('new goal object isn\'t ready')
        ctx.reply('Параметры цели заданы не полностью')
        return null
    }

    if (!ctx.session.SGUser) {
        logger.default.debug('user isn\'t defined')
        return yield req.make('sendMessage', {
            text: ctx.i18n.t('errors.goals.user_not_defined')
        })
    }
    
    const ret = yield req.make(ctx, 'goals', {
        title: newGoal.get('title'),
        text: newGoal.get('text'),
        owner: { id: ctx.session.SGUser.get('id')} ,
        method: 'POST'
    })

    ctx.reply('Цель создана')
    
    // Сетим айдишник цели в объекте контракта
    const newContract = newGoal.get('contract')
    newContract.set({goal_id: ret.id})
    
    yield req.make(ctx, 'contracts', {
        duration: newContract.get('duration'),
        week_days: newContract.get('week_days'),
        month_days: newContract.get('month_days'),
        owner: { id: ctx.session.SGUser.get('id')} ,
        goal: { id: newContract.get('goal_id')} ,
        method: 'POST'
    })

    ctx.reply('Контракт подписан')
    
    session.deleteFromSession(ctx, 'state')
    session.deleteFromSession(ctx, 'newGoalId')
});