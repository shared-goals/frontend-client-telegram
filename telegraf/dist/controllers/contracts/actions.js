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
const keyboards = require("../../util/keyboards")
const Goal = require("../../models/Goal")
const Contract = require("../../models/Contract")
const User = require("../../models/User")
const req = __importDefault(require("../../util/req"))

let shortcuts = {}
exports.shortcuts = shortcuts

/**
 *
 * @param ctx
 */
const contractsListViewAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply(ctx.i18n.t('scenes.contracts.list_all.fetching'))
    
    let contracts = yield req.make(ctx, 'users/' + ctx.session.SGUser.get('id') + '/contracts', {
        method: 'GET'
    })
    
    // конвертируем записи в объекты
    contracts = yield contracts.map((contract) => (new Contract.default()).set(contract))
    
    const contractsListKeyboard = helpers.contractsListKeyboard(ctx, contracts)
    contractsListKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.contracts.list_all.welcome_text'), contractsListKeyboard)
})

exports.contractsListViewAction = contractsListViewAction

/**
 *
 * @param ctx
 */
const contractViewAction = async(ctx, contractData) => __awaiter(void 0, void 0, void 0, function* () {
    let data = (typeof contractData).toLowerCase() === 'string'
        ? {p: contractData} : (ctx.callbackQuery ? JSON.parse(ctx.callbackQuery.data) : null)

    console.log(contractData, data)
    
    if (data !== null) {
        const contract = yield (new Contract.default()).findById(ctx, data.p).then((g) => {return g})

        const keyboard = helpers.contractViewKeyboard(ctx, contract)
        keyboard.disable_web_page_preview = true
        
        yield ctx.replyWithHTML(
            `<i>Цель:</i>\r\n    <b>${contract.get('goal').title}</b>`
                + (contract.get('goal').code ? ' (' + contract.get('goal').code + ')' : '') + `\r\n`
            + `<i>План контракта:</i>\r\n    <b>${contract.toString()}</b>`
        )
    
        yield ctx.reply('Действия:', keyboard)
    } else {
        logger.default.error(ctx, 'Error setting contract id')
        yield ctx.reply('Ошибка задания номера контракта')
    }
})
exports.contractViewAction = contractViewAction

/**
 *
 * @param ctx
 * @param contract
 */
const editContractAction = async(ctx, contract) => __awaiter(void 0, void 0, void 0, function* () {
    let data = null
    if ((typeof contract).toLowerCase() === 'string') {
        data = {p: contract}
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
        contract = yield (new Contract.default()).findById(ctx, data.p)
        ctx.session.updatingContractId = contract.get('id')
        ctx.session.state = 'enterUpdatingContract'
    }
    
    ctx.replyWithHTML(ctx.i18n.t('scenes.goals.set_occupation.text'))
})

exports.editContractAction = editContractAction

/**
 *
 * @param ctx
 * @param goal
 */
const setContractInStoredObject = async(ctx, contract, text) => __awaiter(void 0, void 0, void 0, function* () {
    // Валидируем введенную строку
    let correct = contract.validateFormat(ctx, text)

    if (correct !== null) {
        logger.default.debug(ctx, 'Setting new contract occupation to', text)
    
        contract.set(correct)
        contract.set({occupation: text})
        contract.updateReadyState(ctx)
    
        return true
    } else {
        logger.default.error(ctx, 'Error setting new contract occupation. Parse error:', text)

        yield ctx.reply('Некорректное значение параметра занятости')
        
        return false
    }
})
exports.setContractInStoredObject = setContractInStoredObject

/**
 * Обрабатывает ввод произвольных строк с консоли
 *
 * @param ctx
 */
exports.defaultHandler = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.match.input
    logger.default.debug(ctx, 'Contracts default Handler:', text)
    
    // Смотрим короткие команды, если надены какая-то из них - выполняем и уходим
    if ((yield common.checkShortcuts(ctx, text, shortcuts)) === true) {
        return
    }
    
    // Если был определен стейт
    if (ctx.session.hasOwnProperty('state') && ctx.session.state !== null) {
    
        logger.default.debug(ctx, 'Короткие команды не распознаны, определяем состояние: ', ctx.session.state)
    
        let contract = yield (new Contract.default()).findById(ctx, ctx.session.updatingContractId)
        if (!contract) {
            logger.default.error(ctx, 'Ошибка определения объекта контракта')
    
            // Иначе выводис сообщение о неправильной команде
            const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
            yield ctx.reply(ctx.i18n.t('other.default_handler'), mainKeyboard)
        } else {
            switch (ctx.session.state) {
        
                // Ввод параметров для апдейта существующего контракта
        
                case 'enterUpdatingContract': {
                    const ret = yield setContractInStoredObject(ctx, contract, text)
                    if (ret !== false) {
                        yield contract.save(ctx)
                        ctx.reply('Данные контракта сохранены')
                    }
                    break
                }
            }
        }
    }
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