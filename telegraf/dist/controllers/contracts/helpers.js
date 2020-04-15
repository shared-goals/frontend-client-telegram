"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")
const Commit = require("../../models/Commit")

/**
 * Генерирует главное меню сцены "Контракты" - меню со списком своих контрактов
 *
 * @param ctx
 * @param contracts
 * @returns {*|ExtraEditMessage}
 */
function contractsListKeyboard(ctx, contracts) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(
        (contracts || []).map((contract) => {
            return [m.callbackButton(contract.get('goal').title
                + (contract.get('goal').code ? ' (' + contract.get('goal').code + ')' : '')
                + ': ' + contract.toString(), JSON.stringify({ a: 'contractView', p: contract.get('id') }), false)]
        }), {}))
}

exports.contractsListKeyboard = contractsListKeyboard

/**
 * Генерирует главное меню сцены "Контракты" - меню со списком своих контрактов
 *
 * @param ctx
 * @param contracts
 * @returns {*|ExtraEditMessage}
 */
function newCommitViewKeyboard(ctx, commitId) {
    const defaults = {
        icons: {
            check: {
                empty: '▫️ ',
                checked: '✅ '
            }
        }
    }
    let newCommit
    if (typeof ctx.session.newCommitId !== 'undefined' && typeof ctx.session.commits !== 'undefined') {
        newCommit = ctx.session.commits[ctx.session.newCommitId]
    } else {
        newCommit = new Commit.default()
    }
    
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(
                (!newCommit || newCommit.get('duration') === null || newCommit.get('duration') === '' || newCommit.get('duration') === 0 || typeof newCommit.get('duration') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.commits.create_new.set_duration.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.commits.create_new.edit_duration.button_text')),
                'setNewCommitDuration', false)
        ],
        [
            m.callbackButton(
                (!newCommit || newCommit.get('whats_done') === null || newCommit.get('whats_done') === '' || typeof newCommit.get('whats_done') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.commits.create_new.set_whats_done.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.commits.create_new.edit_whats_done.button_text')),
                'setNewCommitWhatsDone', false)
        ],
        [
            m.callbackButton(
                (!newCommit || newCommit.get('whats_next') === null || newCommit.get('whats_next') === '' || typeof newCommit.get('whats_next') === 'undefined'
                    ? defaults.icons.check['empty'] + ctx.i18n.t('scenes.commits.create_new.set_whats_next.button_text')
                    : defaults.icons.check['checked'] + ctx.i18n.t('scenes.commits.create_new.edit_whats_next.button_text')),
                'setNewCommitWhatsNext', false)
        ],
        [
            m.callbackButton(ctx.i18n.t('scenes.submit.button_text'), 'newCommitSubmit', false),
            m.callbackButton(ctx.i18n.t('scenes.back.button_text'), ctx.i18n.t('keyboards.main_keyboard.contracts'), false)
        ]
    ], {}))
}

exports.newCommitViewKeyboard = newCommitViewKeyboard

/**
 * Генерирует меню с кнопками для режима просмотра своей цели
 *
 * @param ctx
 * @param contract
 * @returns {*|ExtraEditMessage}
 */
function contractViewKeyboard(ctx, contract) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.edit_contract.button_text'), JSON.stringify({ a: 'editContract', p: contract.get('id') }), false),
            m.callbackButton(ctx.i18n.t('scenes.goals.view_goal.set_commit.button_text'), JSON.stringify({ a: 'setCommit', p: contract.get('id') }), false)
        ]
    ], {}))
}

exports.contractViewKeyboard = contractViewKeyboard;
