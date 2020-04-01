'use strict'

require('dotenv').config()

let controller = require('../controllers/goals')
let defaults = require('../globals')
let scenes = require('../modules/Scenes')
let i18n = require('../modules/I18n')


/**
 * ==============================
 * Сцены - кнопки
 * ==============================
 */

// Создание новой цели

scenes.all.set({
    id: 'newgoal',
    text: i18n.t('scenes.goals.create_new.button_text'),
    callback_data: controller.createNewGoalMenu
})
scenes.all.set({
    id: 'setNewGoalTitle',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_title.button_text'),
    callback_data: controller.setNewGoalTitle
})
scenes.all.set({
    id: 'setNewGoalDescription',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_description.button_text'),
    callback_data: controller.setNewGoalDescription
})
scenes.all.set({
    id: 'setNewGoalOccupation',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.button_text'),
    callback_data: controller.setNewGoalOccupationMenu
})
scenes.all.set({
    id: 'setNewGoalTitleSubmit',
    callback_data: controller.setNewGoalTitleSubmit
})
scenes.all.set({
    id: 'setNewGoalDescriptionSubmit',
    callback_data: controller.setNewGoalDescriptionSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationSubmit',
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationEvery',
    text: i18n.t('scenes.goals.set_occupation.every'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationMonday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.monday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationTuesday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.tuesday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationWednesday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.wednesday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationThursday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.thursday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationFriday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.friday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationSaturday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.saturday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationSunday',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.sunday'),
    callback_data: controller.setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalSubmit',
    text: defaults.icons.check.empty + i18n.t('scenes.goals.submit.button_text'),
    callback_data: controller.setNewGoalSubmit
})


//
scenes.all.set({
    id: 'setcontract',
    text: i18n.t('scenes.goals.set_contract.button_text'),
    callback_data: controller.setGoalContract
})
scenes.all.set({
    id: 'setcommit',
    text: i18n.t('scenes.goals.set_commit.button_text'),
    callback_data: controller.setGoalCommit
})
scenes.all.set({
    id: 'listgoals',
    text: i18n.t('scenes.goals.list_all.button_text'),
    callback_data: controller.listAllGoalsHandler
})


/**
 * ==============================
 * Сцены - сеты кнопок
 * ==============================
 */

scenes.all.set({
    id: 'newgoalmenu',
    key: i18n.t('scenes.goals.create_new.button_text'),
    text: i18n.t('scenes.goals.create_new.welcome_text'),
    reply_markup: {
        inline_keyboard: [
            [
                {id: 'setNewGoalTitle'},
                {id: 'setNewGoalDescription'},
                {id: 'setNewGoalOccupation'},
            ], [
                {id: 'setNewGoalSubmit', text: i18n.t('scenes.submit.button_text')},
                {id: 'welcome', text: i18n.t('scenes.back.button_text')}
            ]
        ]
    }
})

scenes.all.set({
    id: 'goals',
    key: i18n.t('scenes.goals.button_text'),
    text: 'Выберите с чем Вы хотели бы работать',//i18n.t('scenes.goals.welcome_text'),
    reply_markup: {
        inline_keyboard: [
            [
                {id: 'listgoals'},
                {id: 'newgoal'},
            ], [
                {id: 'welcome', text: i18n.t('scenes.back.button_text')}
            ]
        ],
        resize_keyboard: true
    }
})

scenes.all.set({
    id: 'setNewGoalOccupationMenu',
    key: i18n.t('scenes.goals.set_occupation.button_text'),
    text: i18n.t('scenes.goals.set_occupation.text'),
    reply_markup: {
        inline_keyboard: [
            [
                {id: 'setNewGoalOccupationEvery'},
                {id: 'setNewGoalOccupationMonday'},
                {id: 'setNewGoalOccupationTuesday'},
                {id: 'setNewGoalOccupationWednesday'},
                {id: 'setNewGoalOccupationThursday'},
                {id: 'setNewGoalOccupationFriday'},
                {id: 'setNewGoalOccupationSaturday'},
                {id: 'setNewGoalOccupationSunday'},
            ], [
                {id: 'newgoalmenu', text: i18n.t('scenes.back.button_text')}
            ]
        ],
        resize_keyboard: true
    }
})
