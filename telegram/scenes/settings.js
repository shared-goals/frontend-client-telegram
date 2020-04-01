'use strict'

require('dotenv').config()

let controller = require('../controllers/settings')
let scenes = require('../modules/Scenes')
let i18n = require('../modules/I18n')


// Settings from subs to parent
scenes.all.set({
    id: 'changeLanguage',
    key: i18n.t('scenes.settings.change_language.button_text'),
    text: i18n.t('scenes.settings.change_language.welcome_text'),
    callback_data: controller.changeLanguage
})

scenes.all.set({
    id: 'changeLanguageMenu',
    key: i18n.t('scenes.settings.select_language.button_text'),
    text: i18n.t('scenes.settings.select_language.welcome_text'),
    reply_markup: {
        inline_keyboard: [
            [
                {text: `🇬🇧 English`, callback_data:'en'},
                {text: `🇷🇺 Русский`, callback_data:'ru'}
            ], [
                {id: 'settings', text: i18n.t('scenes.settings.select_language.back.button_text')},
                {id: 'welcome', text: i18n.t('scenes.back.button_text')}
            ]
        ]
    }
})

scenes.all.set({
    id: 'settings',
    key: i18n.t('scenes.settings.button_text'),
    text: i18n.t('scenes.settings.welcome_text'),
    reply_markup: {
        inline_keyboard: [
            [
                {id: 'changeLanguage'}
            ], [
                {id: 'welcome', text: i18n.t('scenes.back.button_text')}
            ]
        ]
    }
})
