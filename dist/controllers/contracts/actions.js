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

const durationParse = require('parse-duration')

const helpers = require("./helpers")
const common = __importDefault(require("../../util/common"))
const logger = __importDefault(require("../../util/logger"))
const session = __importDefault(require("../../util/session"))
const keyboards = require("../../util/keyboards")
const Goal = require("../../models/Goal")
const Contract = require("../../models/Contract")
const Commit = require("../../models/Commit")

let shortcuts = {}

/**
 *
 * @param ctx - Объект контекста
 */
const contractsListViewAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply(ctx.i18n.t('scenes.contracts.list_all.fetching'))
    
    const contracts = yield (new Contract.default()).findByUser(ctx)
    
    const contractsListKeyboard = helpers.contractsListKeyboard(ctx, contracts)
    contractsListKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.contracts.list_all.welcome_text'), contractsListKeyboard)
    return true
})

exports.contractsListViewAction = contractsListViewAction

/**
 *
 * @param ctx - Объект контекста
 * @param data
 */
const contractViewAction = async(ctx, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Разбираем переданные через контекст или директ-коллом аргументы
    data = common.getCallArguments(ctx, data)

    if (data !== null) {
        let contract
        const goal = yield (new Goal.default()).find(ctx, data.p)
        if (goal !== null) {
            contract = goal.get('contract')
        } else {
            contract = yield (new Contract.default()).findById(ctx, data.p)
        }

        const keyboard = helpers.contractViewKeyboard(ctx, contract)
        keyboard.disable_web_page_preview = true
        
        yield ctx.replyWithHTML(
            `<i>Цель:</i>\r\n    <b>${contract.get('goal').title}</b>`
                + (contract.get('goal').code ? ' (' + contract.get('goal').code + ')' : '') + `\r\n`
            + `<i>План контракта:</i>\r\n    <b>${contract.toString()}</b>`
        )
    
        yield ctx.reply('Действия:', keyboard)
        return true
    } else {
        logger.default.error(ctx, 'Error setting contract id')
        yield ctx.reply('Ошибка задания номера контракта')
        return false
    }
})
exports.contractViewAction = contractViewAction

/**
 * Стартует процесс ввода нового коммита.
 * Вызывается либо нажатием на кнопку "Сделать коммит", либо короткой командой /commit ...
 *
 * @param ctx - Объект контекста
 * @param data
 */
const newCommitViewAction = async(ctx, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Разбираем переданные через контекст или директ-коллом аргументы
    data = common.getCallArguments(ctx, data)
    let commits = {}
    
    // Если это ввод параметров для создания новой цели
    if (data && data.hasOwnProperty('p') && typeof data.p !== 'undefined'
        && !ctx.session.newCommitId || typeof ctx.session.newCommitId === 'undefined') {
    
        // Создаем объект нового коммита, сетим в сессию
        commits = ctx.session.commits || {}
        session.saveToSession(ctx, 'newCommitId', Math.round(Math.random() * 1000000))
        commits[ctx.session.newCommitId] = yield new Commit.default()
    
        // Пытаемся определить все параметры переданной строки вргументов коммита
        const matches = commits[ctx.session.newCommitId].re.exec(data.p)

        // Если мы передали строку из короткой команды
        if (matches && matches.groups) {
            // Составляем объект данных из распарсенной строки
            const query = {
                owner: matches.groups.owner || null,
                code: matches.groups.code || null,
                hours: parseInt(matches.groups.hours || '0', 10),
                minutes: parseInt(matches.groups.minutes || '0', 10),
                whats_done: matches.groups.whats_done || '',
                whats_next: matches.groups.whats_next || ''
            }
            console.log(query)
            // Считаем длительность из часов и минут
            query.duration = durationParse(query.hours + 'h ' + query.minutes + 'min') / 1000 / 60
    
            // Определяем контракт из строки юзера и кода или хэша цели
            let contract
            const goal = yield (new Goal.default())
                .find(ctx, !query.owner ? query.code : (query.owner + '/' + query.code))
            if (goal !== null) {
                contract = goal.get('contract')
            } else {
                contract = yield (new Contract.default()).findById(ctx, data.p)
            }

            // сетим контракт в объекте нового коммита
            yield commits[ctx.session.newCommitId].set(Object.assign(query, { contract: contract }))
    
            // Сохраняем объект нового коммита в сессию
            session.saveToSession(ctx, 'commits', commits)
            
            yield newCommitSubmit(ctx)
            
            return true
        } else {
    
            // Иначе сетим объект из хэша
            commits[ctx.session.newCommitId].set({ contract: yield (new Contract.default()).findById(ctx, data.p) })
    
            // Сохраняем объект нового коммита в сессию
            session.saveToSession(ctx, 'commits', commits)
    
            const newCommitViewKeyboard = helpers.newCommitViewKeyboard(ctx)
            newCommitViewKeyboard.disable_web_page_preview = true
            yield ctx.reply(ctx.i18n.t('scenes.commits.create_new.welcome_text'), newCommitViewKeyboard)
        }
    }
})
exports.newCommitViewAction = newCommitViewAction

/**
 * Проверяет введенную строку контракта на валидность и сохраняет ее в объекте редактируемого контракта
 *
 * @param ctx - Объект контекста
 * @param contract
 * @param text
 */
const setContractInStoredObject = async(ctx, contract, text) => __awaiter(void 0, void 0, void 0, function* () {
    // Валидируем введенную строку
    let correct = yield contract.validateFormat(ctx, text)

    if (correct !== null) {
        logger.default.debug(ctx, 'Setting new contract occupation to', text)
        
        contract.set(correct)
        contract.set({occupation: text})
        yield contract.updateReadyState(ctx)
    
        return true
    } else {
        logger.default.error(ctx, 'Error setting new contract occupation. Parse error:', text)

        yield ctx.reply('Некорректное значение параметра занятости')
        
        return false
    }
})
exports.setContractInStoredObject = setContractInStoredObject

/**
 * Обрабатывает нажатия на кнопки ввода различных параметров нового коммита
 *
 * @param ctx - Объект контекста
 */
exports.newGoalAnyButtonAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Смотрим в каким действием была нажатая кнопка, в зависимости от этого сетим стейты
    switch (ctx.callbackQuery && ctx.callbackQuery.data) {
        case 'setNewCommitDuration': {
            ctx.reply(ctx.i18n.t('scenes.commits.create_new.set_duration.text'))
            ctx.session.state = 'enterNewCommitDuration'
            break
        }
        case 'setNewCommitWhatsDone': {
            ctx.reply(ctx.i18n.t('scenes.commits.create_new.set_whats_done.text'))
            ctx.session.state = 'enterNewCommitWhatsDone'
            break
        }
        case 'setNewCommitWhatsNext': {
            ctx.reply(ctx.i18n.t('scenes.commits.create_new.set_whats_next.text'))
            ctx.session.state = 'enterNewCommitWhatsNext'
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
        goal = yield (new Goal.default()).find(ctx, data.p)
        ctx.session.updatingGoalId = goal.get('id')
        ctx.session.state = 'enterUpdatingGoalContract'
    } else {
        ctx.session.state = 'enterNewGoalContract'
    }
    let currentContract = null
    
    if (goal !== null) {
        currentContract = goal.get('contract').toString()
    }
    
    ctx.replyWithHTML(`Текущий контракт: <code>${currentContract || 'не определен'}</code>\r\n\r\n`
        + ctx.i18n.t('scenes.goals.create_new.set_occupation.text'))
})

exports.editContractAction = editContractAction

/**
 * Обрабатывает ввод произвольных строк с консоли
 *
 * @param ctx - Объект контекста
 */
exports.defaultHandler = async(ctx, params) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.match.input
    logger.default.debug(ctx, 'Contracts default Handler:', text, 'with state', ctx.session.state)
    
    // Смотрим короткие команды, если надены какая-то из них - выполняем и уходим
    if ((yield common.checkShortcuts(ctx, text, shortcuts)) === true) {
        return
    }
    
    // Иначе, для остальных вводимых строк
    let commit = null
    let currentCommits = null
    let contract = null
    let currentContracts = null
    
    // Если не определена цель, а текущий стейт - по апдейту цели или вставке новой цели - выходим
    if (!(ctx.session.state || '').match(/(New|Updating)/)) {
        logger.default.error(ctx, 'Ошибка определения объекта редактирования')
    } else {
    
        logger.default.debug(ctx, 'Короткие команды не распознаны, определяем состояние: ', ctx.session.state)
    
        if (ctx.session.state && ctx.session.state !== '') {
            if (ctx.session.state.match(/NewContract/)) {
                currentContracts = ctx.session.contracts
                contract = currentContracts[ctx.session.newContractId]
            } else if (ctx.session.state.match(/UpdatingGoal/)) {
                const goal = yield (new Goal.default()).find(ctx, ctx.session.updatingGoalId)
                contract = goal.get('contract')
            } else if (ctx.session.state.match(/NewCommit/)) {
                currentCommits = ctx.session.commits
                commit = currentCommits[ctx.session.newCommitId]
            } else if (ctx.session.state.match(/UpdatingCommit/)) {
                commit = yield (new Commit.default()).find(ctx, ctx.session.updatingCommitId)
            }
    
        }
    
        if (!contract && !commit) {
            logger.default.error(ctx, 'Ошибка определения объекта редактирования')
        
            // Иначе выводис сообщение о неправильной команде
            const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
            yield ctx.reply(ctx.i18n.t('other.default_handler'), mainKeyboard)
        } else {
            switch (ctx.session.state) {
    
                // Ввод параметров для апдейта существующей цели
    
                case 'enterUpdatingGoalContract': {
                    const ret = yield setContractInStoredObject(ctx, contract, text)
                    if (ret !== false) {
                        contract.save(ctx)
                        yield ctx.reply('Данные контракта сохранены')
                    }
                    break
                }

                // Ввод параметров для добавления нового коммита
    
                case 'enterNewCommitDuration': {
                    logger.default.debug(ctx, 'Setting new commit duration to', text)
                    const parsedDur = durationParse(text) / 1000 / 60
                    
                    // Если больше одной минуты - считаем корректным вводом и фиксируем в объекте
                    if (parsedDur > 1) {
                        commit.set({ duration: parsedDur })
                        commit.updateReadyState(ctx)
    
                        currentCommits[ ctx.session.newCommitId ] = commit
                        session.saveToSession(ctx, 'commits', currentCommits)
                    } else {
                        ctx.reply('Некорректный ввод длительности работы')
                    }
                    
                    newCommitViewAction(ctx)
                    break
                }
                case 'enterNewCommitWhatsDone': {
                    logger.default.debug(ctx, 'Setting new commit whats done text to', text)
                    commit.set({ whats_done: text })
                    commit.updateReadyState(ctx)
        
                    currentCommits[ ctx.session.newCommitId ] = commit
                    session.saveToSession(ctx, 'commits', currentCommits)
        
                    newCommitViewAction(ctx)
                    break
                }
                case 'enterNewCommitWhatsNext': {
                    logger.default.debug(ctx, 'Setting new commit whats next text to', text)
                    commit.set({ whats_next: text })
                    commit.updateReadyState(ctx)
    
                    currentCommits[ ctx.session.newCommitId ] = commit
                    session.saveToSession(ctx, 'commits', currentCommits)
    
                    newCommitViewAction(ctx)
                    break
                }
            }
        }
    }
})

/**
 * Завершает процесс ввода нового коммита.
 * Вызывается либо нажатием на кнопку "Отправить", либо после обработки короткой команды /commit ...
 *
 * @param ctx - Объект контекста
 */
const newCommitSubmit = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let newCommit
    
    if (typeof ctx.session.newCommitId !== 'undefined' && typeof ctx.session.commits !== 'undefined') {
        newCommit = ctx.session.commits[ctx.session.newCommitId]
    }
    
    if (!newCommit) {
        logger.default.error(ctx, 'new goal object isn\'t defined')
        ctx.reply('Цель не задана')
        return null
    }
    
    newCommit.updateReadyState(ctx)
    
    if (newCommit.get('ready') !== true) {
        logger.default.error(ctx, 'new commit object isn\'t ready')
        ctx.reply('Параметры коммита заданы не полностью')
        return null
    }
    
    if (!ctx.session.SGUser) {
        logger.default.debug(ctx, 'user isn\'t defined')
        ctx.reply(ctx.i18n.t('errors.goals.user_not_defined'))
    }
    
    yield newCommit.save(ctx)
    ctx.reply('Коммит создан')
    
    session.deleteFromSession(ctx, 'state')
    session.deleteFromSession(ctx, 'newCommitId')
})

exports.newCommitSubmit = newCommitSubmit

/**
 * Устанавливает локальную переменную, содержащую текущие короткие команды
 * @param data
 */
exports.setShortcuts = (data) => shortcuts = data

/**
 * Возвращает локальную переменную, содержащую текущие короткие команды
 */
exports.getShortcuts = () => shortcuts;
