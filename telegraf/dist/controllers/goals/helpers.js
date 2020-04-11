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

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")
const Goal = require("../../models/Goal")

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/**
 * Проверяет валидность введенной строки занятости:
 * XXm|h every (day|mon|tue|...|week|month|XX,XX)
 * Примеры:
 *   10m every day
 *   3h every sat,sun
 *   10h every week
 * @param txt
 */
const validateContractFormat = (ctx, txt) => {
    const mins_variants = ('m|min|mins|minutes|' + ctx.i18n.t('min_plur')).split('|')
    const hours_variants = ('h|hour|hours|' + ctx.i18n.t('hour_plur')).split('|')

    let regStr = '^(\\d+)\\s*('
        + mins_variants.join('|')
        + '|' + hours_variants.join('|')
        + '|' + ctx.i18n.t('min_plur') + '|' + ctx.i18n.t('hour_plur') + ')'
        + '\\s+(every|' + ctx.i18n.t('every_plur') + ')\\s+(('
        + 'day|' + ctx.i18n.t('day')
        + '|week|' + ctx.i18n.t('week_plur')
        + '|month|' + ctx.i18n.t('month')
        + '|' + weekdays.join('|')
        + '|' + weekdays.map((item) => item.substr(0, 3)).join('|')
        + '|' + weekdays.map((item) => ctx.i18n.t(item)).join('|')
        + '|\\d+|\\d+,\\d+|,){1,13})$'
    // logger.info(regStr)
    let re = new RegExp(regStr, 'gi')
    let data = re.exec(txt)
    let ret
    if (data !== null) {
        ret = parseContractText(ctx, data.slice(1, 5))
    } else {
        ret = data
    }
    return ret
}
exports.validateContractFormat = validateContractFormat

/**
 * Парсит исходный формат занятости и возвращает форматированный для хранения в БД
 * @param data введенный формат занятости. Пример: Array ['20', 'min', 'every', 'mon,sat]
 * @returns {{}}
 */
const parseContractText = (ctx, data) => {
    const mins_variants = ('m|min|mins|minutes|' + ctx.i18n.t('min_plur')).split('|')
    const hours_variants = ('h|hour|hours|' + ctx.i18n.t('hour_plur')).split('|')

    let ret = {
        duration: null,
        week_days: [],
        month_days: []
    }
    
    if (mins_variants.indexOf(data[1]) !== -1) {
        ret.duration = data[0]
    } else if (hours_variants.indexOf(data[1]) !== -1) {
        ret.duration = data[0] * 60
    }
    
    let days = data[3].replace(/\s/, '').replace(/[;|]/, ',').split(',')
    
    let short_weekdays = weekdays.map((item) => item.substr(0, 3))
    let local_weekdays = weekdays.map((item) => ctx.i18n.t(item))
    
    days.forEach((day) => {
        if (day === 'day' || day === ctx.i18n.t('day')) {
            ret.week_days = short_weekdays
        } else if(day.match(/^\d+$/)) {
            ret.month_days.push(parseInt(day, 10))
        } else {
            let idx = weekdays.indexOf(day) !== -1
                ? weekdays.indexOf(day)
                : (short_weekdays.indexOf(day) !== -1
                    ? short_weekdays.indexOf(day)
                    : (local_weekdays.indexOf(day) !== -1
                        ? local_weekdays.indexOf(day)
                        : null))
            if (idx !== null) {
                ret.week_days.push(short_weekdays[idx])
            }
        }
    })
    return ret
}

exports.parseOccupation = parseContractText

/**
 * Возвращает строку параметров занятости по объекту их данных
 * @param data
 * @returns {string}
 */
const stringifyContract = (data) => {
    return (data && data.hasOwnProperty('duration') && data.hasOwnProperty('duration') ?
        ((data.duration >= 60 ? (data.duration / 60) + 'h' : data.duration + 'min')
            + ' every ' + (data.week_days.length > 0 ? data.week_days.join(',') : data.month_days.join(',')))
        : 'не определен')
}

exports.stringifyContract = stringifyContract

/**
 *
 * @param ctx
 * @returns {*|ExtraEditMessage}
 */
function getInitKeyboard(ctx) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(`Новая цель`, JSON.stringify({ a: 'newGoalView' }), false),
            m.callbackButton(`Мои цели`, JSON.stringify({ a: 'goalsListView' }), false),
        ],
        [
            m.callbackButton(`Присоединиться к чьей-то цели`, JSON.stringify({ a: 'joinGoalView' }), false)
        ],
        [
            m.callbackButton(`Мои контракты`, JSON.stringify({ a: 'contractsListView' }), false),
            m.callbackButton(`Отработать контракт`, JSON.stringify({ a: 'setCommitView' }), false)
        ]
    ], {}))
}

exports.getInitKeyboard = getInitKeyboard

/**
 * Клавиатура с кнопками для режима просмотра своей цели
 *
 * @param ctx
 * @param goal
 * @returns {*|ExtraEditMessage}
 */
function goalMyViewKeyboard(ctx, goal) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.edit_contract.button_text'), JSON.stringify({ a: 'editContract', p: goal.get('id') }), false),
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.set_commit.button_text'), JSON.stringify({ a: 'setCommit', p: goal.get('id') }), false)
        ]
    ], {}))
}

exports.goalMyViewKeyboard = goalMyViewKeyboard

/**
 * Клавиатура с кнопками для режима просмотра чужой цели
 *
 * @param ctx
 * @param goal
 * @returns {*|ExtraEditMessage}
 */
function goalAnyViewKeyboard(ctx, goal) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            goal.get('contract') !== null
                ? m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.view_contract.button_text'), JSON.stringify({ a: 'setContract', p: goal.get('id') }), false)
                : m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.join_goal.button_text'), JSON.stringify({ a: 'joinContract', p: goal.get('id') }), false),
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.set_commit.button_text'), JSON.stringify({ a: 'setCommit', p: goal.get('id') }), false)
        ]
    ], {}))
}

exports.goalAnyViewKeyboard = goalAnyViewKeyboard

/**
 *
 * @param ctx
 * @param goals
 * @returns {*|ExtraEditMessage}
 */
function goalsListKeyboard(ctx, goals) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(
        (goals || []).map((goal) => {
            return [m.callbackButton(goal.get('title'), JSON.stringify({ a: 'goalView', p: goal.get('id') }), false)]
        }), {}))
}

exports.goalsListKeyboard = goalsListKeyboard

/**
 *
 * @param ctx
 * @returns {*|ExtraEditMessage}
 */
function newGoalViewKeyboard(ctx) {
    const defaults = {
        icons: {
            check: {
                empty: '⭕ ',
                checked: '✅ '
            }
        }
    }
    let newGoal
    if (typeof ctx.session.newGoalId !== 'undefined' && typeof ctx.session.goals !== 'undefined') {
        newGoal = ctx.session.goals[ctx.session.newGoalId]
    } else {
        newGoal = new Goal.default()
    }
    // console.log(`\r\n\r\n` + JSON.stringify(newGoal) + `\r\n\r\n`, !newGoal, newGoal.get('contract'), newGoal.get('contract').get('occupation'), newGoal.get('contract').get('occupation') === null, newGoal.get('contract').get('occupation') === '')
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('title') === null || newGoal.get('title') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_title.button_text'), 'setNewGoalTitle', false),
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('text') === null || newGoal.get('text') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_description.button_text'), 'setNewGoalDescription', false),
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('contract').get('ready') === false ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_occupation.button_text'), 'setNewGoalContract', false)
        ],
        [
            m.callbackButton(ctx.i18n.t('scenes.submit.button_text'), 'newGoalSubmit', false),
            m.callbackButton(ctx.i18n.t('scenes.back.button_text'), ctx.i18n.t('keyboards.main_keyboard.goals'), false)
        ]
    ], {}))
}

exports.newGoalViewKeyboard = newGoalViewKeyboard;
