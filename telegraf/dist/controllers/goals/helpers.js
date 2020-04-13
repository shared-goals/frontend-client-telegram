"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")
const Goal = require("../../models/Goal")

/**
 * Генерирует главное меню сцены "Цели"
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
            m.callbackButton(ctx.i18n.t('scenes.goals.join_goal.button_text'), 'setOwnerForGoalJoining', false)
        ]
    ], {}))
}

exports.getInitKeyboard = getInitKeyboard

/**
 * Генерирует меню с кнопками для режима просмотра своей цели
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
 * Генерирует меню с кнопками для режима просмотра чужой цели
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
                : m.callbackButton(ctx.i18n.t('scenes.goals.join_goal.button_text'), JSON.stringify({ a: 'joinContract', p: goal.get('id') }), false),
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.set_commit.button_text'), JSON.stringify({ a: 'setCommit', p: goal.get('id') }), false)
        ]
    ], {}))
}

exports.goalAnyViewKeyboard = goalAnyViewKeyboard

/**
 * Генерирует сет кнопок списка целей
 *
 * @param ctx
 * @param goals
 * @returns {*|ExtraEditMessage}
 */
function goalsListKeyboard(ctx, goals) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(
        (goals || []).map((goal) => {
            return [m.callbackButton(goal.get('title') + (goal.get('code') ? ' (' + goal.get('code') + ')' : ''),
                JSON.stringify({ a: 'goalView', p: goal.get('id') }), false)]
        }), {}))
}

exports.goalsListKeyboard = goalsListKeyboard

/**
 * Генерирует меню ввода параметров новой создаваемой цели
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

    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('code') === null || newGoal.get('code') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_code.button_text'), 'setNewGoalCode', false),
            m.callbackButton(defaults.icons.check[!newGoal || newGoal.get('title') === null || newGoal.get('title') === '' ? 'empty' : 'checked']
                + ctx.i18n.t('scenes.goals.set_title.button_text'), 'setNewGoalTitle', false)
        ], [
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
