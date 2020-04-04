"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")

/**
 * Returns back keyboard and its buttons according to the language
 * @param ctx - telegram context
 */
exports.getBackKeyboard = (ctx) => {
    const backKeyboardBack = ctx.i18n.t('keyboards.back_keyboard.back')
    let backKeyboard = Telegraf.Markup.keyboard([backKeyboardBack])
    backKeyboard = backKeyboard.resize().extra()
    return {
        backKeyboard,
        backKeyboardBack
    }
}

/**
 * Returns main keyboard and its buttons according to the language
 * @param ctx - telegram context
 */
exports.getMainKeyboard = (ctx) => {
    const mainKeyboardGoals = ctx.i18n.t('keyboards.main_keyboard.goals')
    const mainKeyboardContracts = ctx.i18n.t('keyboards.main_keyboard.contracts')
    
    const mainKeyboardSettings = ctx.i18n.t('keyboards.main_keyboard.settings')
    const mainKeyboardAbout = ctx.i18n.t('keyboards.main_keyboard.about')

    let mainKeyboard = Telegraf.Markup.keyboard([
        [mainKeyboardGoals, mainKeyboardContracts],
        [mainKeyboardSettings, mainKeyboardAbout]
    ])
    
    mainKeyboard = mainKeyboard.resize().extra()
    
    return {
        mainKeyboard,
        mainKeyboardGoals,
        mainKeyboardContracts,
        mainKeyboardSettings,
        mainKeyboardAbout
    }
};
