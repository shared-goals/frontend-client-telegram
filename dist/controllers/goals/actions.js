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
const common = __importDefault(require("../../util/common"))
const logger = __importDefault(require("../../util/logger"))
const session = __importDefault(require("../../util/session"))
const api = require('sg-node-api')
const User = api.user
const Goal = api.goal
const Contract = api.contract

let shortcuts = {}

/**
 *
 * @param ctx - Объект контекста
 */
const newGoalViewAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const newGoalViewKeyboard = helpers.newGoalViewKeyboard(ctx)
    newGoalViewKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.goals.create_new.welcome_text'), newGoalViewKeyboard)
})

exports.newGoalViewAction = newGoalViewAction

/**
 *
 * @param ctx - Объект контекста
 * @param user User
 */
const goalsListViewAction = (ctx, user) => __awaiter(void 0, void 0, void 0, function* () {
    const settedUser = (typeof user === 'object' && !user.hasOwnProperty('query'))
    yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.fetching') + (settedUser ? ' ' + user.get('username') : ''))
    
    // достаем объекты всех записей текущего юзера
    let goals = yield (new Goal()).findAll(ctx, settedUser ? user.get('id') : null)
    
    if (!goals || goals.length === 0) {
        ctx.reply((settedUser
            ? 'У ' + user.get('email').replace(/@.+/, '') + ' еще нет целей.'
            : 'У вас еще нет целей. Пора их создать'))
    } else {
        const goalsListKeyboard = helpers.goalsListKeyboard(ctx, goals)
        goalsListKeyboard.disable_web_page_preview = true
        yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.welcome_text'), goalsListKeyboard)
    }
})

exports.goalsListViewAction = goalsListViewAction

/**
 *
 * @param ctx - Объект контекста
 */
const goalViewAction = async(ctx, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Разбираем переданные через контекст или директ-коллом аргументы
    data = common.getCallArguments(ctx, data)

    if (data !== null) {
        const goal = yield (new Goal()).find(ctx, data.p).then((g) => {return g})
        if (goal === null) {
            ctx.reply('Цель не найдена')
            return
        }

        let owner = ctx.session.user
        const isMyGoal = (owner.get('id') === goal.get('owner').id)
        
        const keyboard = isMyGoal ? helpers.goalMyViewKeyboard(ctx, goal) : helpers.goalAnyViewKeyboard(ctx, goal)
        keyboard.disable_web_page_preview = true
        
        if (!isMyGoal) {
            owner = yield (new User()).findById(ctx, goal.get('owner').id).then((g) => {return g})
        }
    
        yield ctx.replyWithHTML(
            (goal.get('key') && goal.get('key')!=='' ? `Код:\r\n    <code>${goal.get('key')}</code>\r\n` : '')
            + `Наименование:\r\n    <b>${goal.get('title')}</b>`
            + `\r\nТекст:\r\n    ${goal.get('description')}`
            + (goal.get('contract') ? `\r\nМой контракт:\r\n    ${goal.get('contract').toString()}` : '')
            + (isMyGoal ? '' : `\r\nАвтор:\r\n    ${owner.get('email').replace(/@.+$/, '')}`)
            + `\r\nСсылка:\r\n    <code>` + goal.getTGLink(ctx) + `</code>`
        )
    
        yield ctx.reply('Действия:', keyboard)
    } else {
        logger.default.error(ctx, 'Error setting goal id')
        yield ctx.reply('Ошибка задания номер цели')
    }
})

exports.goalViewAction = goalViewAction

/**
 *
 * @param ctx - Объект контекста
 */
const joinGoalAction = async(ctx, goalData) => __awaiter(void 0, void 0, void 0, function* () {
    let data = (typeof goalData).toLowerCase() === 'string'
        ? {p: goalData} : (ctx.callbackQuery ? JSON.parse(ctx.callbackQuery.data) : null)

    const matches = goalData.query.match(/\/contract\s+(?<goal>[^\s]+)\s+(?<contract>.+)$/)
    let goal = null
    let contractData
    if (matches && matches.groups) {
        // Пытаемся определить цель
        if (matches.groups.goal && typeof matches.groups.goal !== 'undefined') {
            goal = yield (new Goal()).find(ctx, matches.groups.goal)
        }
    
        // Если контракт задан
        if (matches.groups.contract) {
            // Пытаемся распарсить строку контракта
            contractData = yield ((new Contract()).validateFormat(ctx, matches.groups.contract))
            if (!contractData) {
                logger.default.error(ctx, 'Ошибка парсинга строки контракта')
                ctx.reply('Ошибка. Некорректно задана строка контракта: ' + matches.groups.contract)
            }
        }
    
        // Если цель определена
        if (goal !== null && contractData !== null) {
            // const owner = (new User.default()).set(goal.get('owner'))
            let contract = yield (new Contract()).findByGoalAndOwner(ctx, goal.get('id'), ctx.session.user.get('id'))
        
            // Если контракт по этой цели у этого пользователя уже был
            if (contract !== null) {
                logger.default.debug(ctx, 'По этой цели у этого пользователя уже есть контракт')
                ctx.reply('По этой цели у Вас уже есть контракт. Для изменения контракта воспользуйтесь командой /contracts из главного раздела или кнопкой "Контракты" в главном меню')
            } else {
                contractData.goal = {id: goal.get('id')}
                contract = (new Contract()).set(contractData)
                yield contract.save(ctx)
                ctx.reply('Данные контракта сохранены')
            }
        } else {
            logger.default.error(ctx, 'Ошибка парсинга пользователя или контракта')
            ctx.reply('Некорректные данные контракта')
        }
    } else {
        logger.default.error(ctx, 'Ошибка парсинга строки контракта')
    }
    
    return true
})

exports.joinGoalAction = joinGoalAction

/**
 *
 * @param ctx - Объект контекста
 */
exports.newGoalAnyButtonAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let goals = null
    
    // Если это ввод параметров для создания новой цели
    if (ctx.callbackQuery && ctx.callbackQuery.data && ctx.callbackQuery.data.match(/NewGoal/)) {
        if (!ctx.session.newGoalId || typeof ctx.session.newGoalId === 'undefined') {
            goals = ctx.session.goals || {}
            session.saveToSession(ctx, 'newGoalId', Math.round(Math.random() * 1000000))
            goals[ctx.session.newGoalId] = yield (new Goal())
            session.saveToSession(ctx, 'goals', goals)
        }
    }
    
    switch (ctx.callbackQuery && ctx.callbackQuery.data) {
        case 'setNewGoalCode': {
            ctx.reply(ctx.i18n.t('scenes.goals.create_new.set_code.text'))
            ctx.session.state = 'enterNewGoalCode'
            break
        }
        case 'setNewGoalTitle': {
            ctx.reply(ctx.i18n.t('scenes.goals.create_new.set_title.text'))
            ctx.session.state = 'enterNewGoalTitle'
            break
        }
        case 'setNewGoalDescription': {
            ctx.reply(ctx.i18n.t('scenes.goals.create_new.set_text.text'))
            ctx.session.state = 'enterNewGoalDescription'
            break
        }
        case 'setNewGoalContract': {
            editContractAction(ctx, goals ? goals[ctx.session.newGoalId] : null)
            break
        }
        case 'setOwnerForGoalJoining': {
            ctx.reply(ctx.i18n.t('scenes.goals.join_goal.welcome_text'))
            ctx.session.state = 'enterOwnerForGoalJoining'
            break
        }
    }
})

/**
 *
 * @param ctx - Объект контекста
 * @param data
 */
const editContractAction = async(ctx, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Разбираем переданные через контекст или директ-коллом аргументы
    data = common.getCallArguments(ctx, data)
    let goal = null
    
    if (data !== null) {
        goal = yield (new Goal()).find(ctx, data.p)
        ctx.session.updatingGoalId = goal.get('id')
        ctx.session.state = 'enterUpdatingGoalContract'
    } else {
        ctx.session.state = 'enterNewGoalContract'
    }
    let currentContract = null
    
    if (goal !== null) {
        currentContract = goal.get('contract').toString()
    }

    ctx.replyWithHTML(`Текущий контракт: <code>${currentContract || 'не определен'}</code>\r\n\r\n` + ctx.i18n.t('scenes.goals.create_new.set_occupation.text'))
})

exports.editContractAction = editContractAction

/**
 * Обрабатывает ввод произвольных строк с консоли
 *
 * @param ctx - Объект контекста
 */
exports.defaultHandler = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.match.input
    logger.default.debug(ctx, 'Goals default Handler:', text, ', storedObjectId:', ctx.session.updatingGoalId)
    
    // Смотрим короткие команды, если надены какая-то из них - выполняем и уходим
    if ((yield common.checkShortcuts(ctx, text, shortcuts)) === true) {
        return
    }
    
    // Иначе, для остальных вводимых строк
    let goal = null
    let currentGoals = null
    
    // Если был определен стейт
    if (ctx.session.hasOwnProperty('state') && ctx.session.state !== null) {

        logger.default.debug(ctx, 'Короткие команды не распознаны, определяем состояние: ', ctx.session.state)

        if (ctx.session.state.match(/NewGoal/)) {
            currentGoals = ctx.session.goals
            goal = currentGoals[ctx.session.newGoalId]
        } else if (ctx.session.state.match(/UpdatingGoal/)) {
            goal = yield (new Goal()).find(ctx, ctx.session.updatingGoalId)
        }
    }

    // Если не определена цель, а текущий стейт - по апдейту цели или вставке новой цели - выходим
    if (!goal && (ctx.session.state || '').match(/(New|Updating)Goal/)) {
        logger.default.error(ctx, 'Ошибка определения объекта цели')
    } else {
        switch (ctx.session.state) {

            // Ввод параметров для апдейта существующей цели

            case 'enterUpdatingGoalContract': {
                // Подгружаем экшны контрактов
                const contractsActions = require('../contracts/actions')

                const contract = goal.get('contract')
                const ret = yield contractsActions.setContractInStoredObject(ctx, contract, text)
                if (ret !== false) {
                    contract.save(ctx)
                    goal.set({contract: contract})
                    goal.updateReadyState(ctx)
                    yield ctx.reply('Данные контракта сохранены')
                }
                break
            }
            
            case 'enterOwnerForGoalJoining': {
                const owner = yield (new User().findByEmail(ctx, text + '@t.me'))
                if (owner !== null) {
                    if (owner.get('id') === ctx.session.user.get('id')) {
                        ctx.reply('Нет смысла подключаться к Вашим собственным целям еще раз. Выберите другого пользователя')
                    } else {
                        goalsListViewAction(ctx, owner)
                    }
                } else {
                    ctx.reply('Пользователь не найден. Попробуйте еще раз')
                }
                break
            }

            // Ввод параметров для добавления новой цели

            case 'enterNewGoalCode': {
                logger.default.debug(ctx, 'Setting new goal key to', text)
                goal.set({key: text})
                goal.updateReadyState(ctx)

                currentGoals[ctx.session.newGoalId] = goal
                session.saveToSession(ctx, 'goals', currentGoals)
    
                newGoalViewAction(ctx)
                break
            }
            case 'enterNewGoalTitle': {
                logger.default.debug(ctx, 'Setting new goal title to', text)
                goal.set({title: text})
                goal.updateReadyState(ctx)

                currentGoals[ctx.session.newGoalId] = goal
                session.saveToSession(ctx, 'goals', currentGoals)
    
                newGoalViewAction(ctx)
                break
            }
            case 'enterNewGoalDescription': {
                logger.default.debug(ctx, 'Setting new goal description to', text)
                goal.set({description: text})
                goal.updateReadyState(ctx)

                currentGoals[ctx.session.newGoalId] = goal
                session.saveToSession(ctx, 'goals', currentGoals)

                newGoalViewAction(ctx)
                break
            }
            case 'enterNewGoalContract': {
                // Подгружаем экшны контрактов
                const contractsActions = require('../contracts/actions')

                let contract = goal.get('contract')
                const ret = yield contractsActions.setContractInStoredObject(ctx, contract, text)
                if (ret !== false) {
                    goal.set({contract: contract})
                    goal.updateReadyState(ctx)

                    currentGoals[ctx.session.newGoalId] = goal
                    session.saveToSession(ctx, 'goals', currentGoals)
                }

                // Снова показываем форму вводимых параметров цели
                newGoalViewAction(ctx)
                break
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
        logger.default.error(ctx, 'new goal object isn\'t defined')
        ctx.reply('Цель не задана')
        return null
    }
    
    newGoal.updateReadyState(ctx)

    if (newGoal.get('ready') !== true) {
        logger.default.error(ctx, 'new goal object isn\'t ready')
        ctx.reply('Параметры цели заданы не полностью')
        return null
    }

    if (!ctx.session.user) {
        logger.default.debug(ctx, 'user isn\'t defined')
        ctx.reply(ctx.i18n.t('errors.goals.user_not_defined'))
    }
    
    const ret = yield newGoal.save(ctx)
    ctx.reply('Цель создана')
    
    // Сетим айдишник цели в объекте контракта
    const newContract = newGoal.get('contract')
    newContract.set({goal: {id: ret.get('id')}})
    newContract.save(ctx)
    ctx.reply('Контракт подписан')
    
    session.deleteFromSession(ctx, 'state')
    session.deleteFromSession(ctx, 'newGoalId')
})

/**
 * Устанавливает локальную переменную, содержащую текущие короткие команды
 * @param data
 */
exports.setShortcuts = (data) => shortcuts = data

/**
 * Возвращает локальную переменную, содержащую текущие короткие команды
 */
exports.getShortcuts = () => shortcuts;
