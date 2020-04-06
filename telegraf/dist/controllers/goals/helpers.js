"use strict";

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
const validateOccupationFormat = (ctx, txt) => {
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
        ret = parseOccupation(ctx, data.slice(1, 5))
    } else {
        ret = data
    }
    return ret
}
exports.validateOccupationFormat = validateOccupationFormat

/**
 * Парсит исходный формат занятости и возвращает форматированный для хранения в БД
 * @param data введенный формат занятости. Пример: Array ['20', 'min', 'every', 'mon,sat]
 * @returns {{}}
 */
const parseOccupation = (ctx, data) => {
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

exports.parseOccupation = parseOccupation

/**
 * Возвращает строку параметров занятости по объекту их данных
 * @param data
 * @returns {string}
 */
const stringifyOccupation = (data) => {
    return (data && data.hasOwnProperty('duration') && data.hasOwnProperty('duration') ?
        ((data.duration >= 60 ? (data.duration / 60) + 'h' : data.duration + 'min')
            + ' every ' + (data.week_days.length > 0 ? data.week_days.join(',') : data.month_days.join(',')))
        : 'не определен')
}

exports.stringifyOccupation = stringifyOccupation

/**
 *
 * @param ctx
 * @returns {*|ExtraEditMessage}
 */
function getInitKeyboard(ctx) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(`Новая цель`, JSON.stringify({ a: 'newGoalCreate' }), false),
            m.callbackButton(`Список целей`, JSON.stringify({ a: 'goalsListView' }), false)
        ],
        [
            m.callbackButton(ctx.i18n.t('scenes.back.button_text'), ctx.i18n.t('keyboards.main_keyboard.goals'), false)
        ]
    ], {}))
}

exports.getInitKeyboard = getInitKeyboard

/**
 *
 * @param ctx
 * @param goal
 * @returns {*|ExtraEditMessage}
 */
function goalViewKeyboard(ctx, goal) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.set_contract.button_text'), JSON.stringify({ a: 'setContract', p: goal.id }), false),
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.set_commit.button_text'), JSON.stringify({ a: 'setCommit', p: goal.id }), false)
        ],
        [
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.back.button_text'), 'goalsListView', false)
        ]
    ], {}))
}

exports.goalViewKeyboard = goalViewKeyboard

/**
 *
 * @param ctx
 * @param goals
 * @returns {*|ExtraEditMessage}
 */
function goalsListKeyboard(ctx, goals) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(
        (goals || []).map((goal) => {
            return [m.callbackButton(goal.title, JSON.stringify({ a: 'goalView', p: goal.id }), false)]
        }).concat([
            [m.callbackButton(ctx.i18n.t('scenes.back.button_text'), ctx.i18n.t('keyboards.main_keyboard.goals'), false)]
        ]), {}))
}

exports.goalsListKeyboard = goalsListKeyboard

/**
 *
 * @param ctx
 * @returns {*|ExtraEditMessage}
 */
function newGoalCreateKeyboard(ctx) {
    const defaults = {
        icons: {
            check: {
                empty: '⭕ ',
                checked: '✅ '
            }
        }
    }
    let newGoal
    if (typeof ctx.session.newGoalId !== 'undefined' && typeof ctx.session.newGoals !== 'undefined') {
        newGoal = ctx.session.newGoals[ctx.session.newGoalId]
        console.log(newGoal)
    } else {
        newGoal = new Goal.default()
    }
    console.log(`\r\n\r\n` + JSON.stringify(newGoal) + `\r\n\r\n`, !newGoal, newGoal.get('contract'), newGoal.get('contract').get('occupation'), newGoal.get('contract').get('occupation') === null, newGoal.get('contract').get('occupation') === '')
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('title') === null || newGoal.get('title') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_title.button_text'), 'setNewGoalTitle', false),
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('text') === null || newGoal.get('text') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_description.button_text'), 'setNewGoalDescription', false),
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('contract').get('occupation') === null || newGoal.get('contract').get('occupation') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_occupation.button_text'), 'setNewGoalOccupation', false)
        ],
        [
            m.callbackButton(ctx.i18n.t('scenes.submit.button_text'), 'setNewGoalSubmit', false),
            m.callbackButton(ctx.i18n.t('scenes.back.button_text'), ctx.i18n.t('keyboards.main_keyboard.goals'), false)
        ]
    ], {}))
}

exports.newGoalCreateKeyboard = newGoalCreateKeyboard;
