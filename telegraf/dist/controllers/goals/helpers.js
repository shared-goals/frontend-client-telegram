"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")
const Goal = require("../../models/Goal")

/**
 * Генерирует главное меню сцены "Цели"
 * @param ctx - Объект контекста
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
 * @param ctx - Объект контекста
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
 * @param ctx - Объект контекста
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
 * @param ctx - Объект контекста
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
 * @param ctx - Объект контекста
 * @returns {*|ExtraEditMessage}
 */
function newGoalViewKeyboard(ctx) {
    const defaults = {
        icons: {
            check: {
                empty: '▫️ ',
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
            m.callbackButton(
                (!newGoal || newGoal.get('title') === null || newGoal.get('title') === '' || typeof newGoal.get('title') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.goals.create_new.set_title.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.goals.create_new.edit_title.button_text')),
                'setNewGoalTitle', false),
            m.callbackButton(
                (!newGoal || newGoal.get('code') === null || newGoal.get('code') === '' || typeof newGoal.get('code') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.goals.create_new.set_code.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.goals.create_new.edit_code.button_text')),
                'setNewGoalCode', false)
        ], [
            m.callbackButton(
                (!newGoal || newGoal.get('occupation') === null || newGoal.get('occupation') === '' || typeof newGoal.get('occupation') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.goals.create_new.set_occupation.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.goals.create_new.edit_occupation.button_text')),
                'setNewGoalContract', false),
            m.callbackButton(
                (!newGoal || newGoal.get('text') === null || newGoal.get('text') === '' || typeof newGoal.get('text') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.goals.create_new.set_text.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.goals.create_new.edit_text.button_text')),
                'setNewGoalDescription', false)
        ],
        [
            m.callbackButton(ctx.i18n.t('scenes.submit.button_text'), 'newGoalSubmit', false),
            m.callbackButton(ctx.i18n.t('scenes.back.button_text'), ctx.i18n.t('keyboards.main_keyboard.goals'), false)
        ]
    ], {}))
}

exports.newGoalViewKeyboard = newGoalViewKeyboard;
