"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")

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
