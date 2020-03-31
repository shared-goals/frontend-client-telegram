'use strict'

require('dotenv').config()

let Goal = require('../models/Goal').Goal
let scenes = require('../modules/Scenes')
let session = require('../models/Session')
let observer = require('../modules/Observer').observer
let MakeRequest = require('../modules/Request').MakeRequest
let i18n = require('../modules/I18n')

let newGoal
let occupationMenuMessageId = null


/**
 * ==============================
 * Сцены - кнопки
 * ==============================
 */

// Создание новой цели

scenes.all.set({
    id: 'newgoal',
    text: i18n.t('scenes.goals.create_new.button_text'),
    callback_data: createNewGoalHandler
})
scenes.all.set({
    id: 'setNewGoalTitle',
    text: '⭕️ ' + i18n.t('scenes.goals.set_title.button_text'),
    callback_data: setNewGoalTitle
})
scenes.all.set({
    id: 'setNewGoalDescription',
    text: '⭕️ ' + i18n.t('scenes.goals.set_description.button_text'),
    callback_data: setNewGoalDescription
})
scenes.all.set({
    id: 'setNewGoalOccupation',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.button_text'),
    callback_data: setNewGoalOccupationMenu
})
scenes.all.set({
    id: 'setNewGoalTitleSubmit',
    text: i18n.t('scenes.goals.set_description.button_text'),
    callback_data: setNewGoalTitleSubmit
})
scenes.all.set({
    id: 'setNewGoalDescriptionSubmit',
    text: i18n.t('scenes.goals.set_description.button_text'),
    callback_data: setNewGoalDescriptionSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationSubmit',
    text: i18n.t('scenes.goals.set_occupation.button_text'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationEvery',
    text: i18n.t('scenes.goals.set_occupation.every'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationMonday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.monday'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationTuesday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.tuesday'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationWednesday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.wednesday'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationThursday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.thursday'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationFriday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.friday'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationSaturday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.saturday'),
    callback_data: setNewGoalOccupationSubmit
})
scenes.all.set({
    id: 'setNewGoalOccupationSunday',
    text: '⭕️ ' + i18n.t('scenes.goals.set_occupation.sunday'),
    callback_data: setNewGoalOccupationSubmit
})

//
scenes.all.set({
    id: 'setcontract',
    text: `🗂 Set contract`,
    callback_data: setGoalContract
})
scenes.all.set({
    id: 'setcommit',
    text: `🗂 Set commit`,
    callback_data: setGoalCommit
})
scenes.all.set({
    id: 'listgoals',
    text: i18n.t('scenes.goals.list_all.button_text'),
    callback_data: listAllGoalsHandler
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
                {id: 'welcome', text: i18n.t('scenes.back.button_text')}
            ]
        ]
    }
})

scenes.all.set({
    id: 'goals',
    key: '🧰 Goals',
    text: 'What do you mean?',
    reply_markup: {
        inline_keyboard: [
            [
                {id: 'listgoals'},
                {id: 'newgoal'},
            ], [
                {id: 'welcome', text: `⬅️ Back`}
            ]
        ]
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


/**
 * ==============================
 * Обработчики
 * ==============================
 */

async function setNewGoalTitle () {
    MakeRequest('sendMessage', {
        text: i18n.t('scenes.goals.set_title.text')
    })
    observer.setNextCallback('setNewGoalTitleSubmit')
}

async function setNewGoalDescription () {
    MakeRequest('sendMessage', {
        text: i18n.t('scenes.goals.set_description.text')
    })
    observer.setNextCallback('setNewGoalDescriptionSubmit')
}

/**
 * Обработчик нажатия на ентер после ввода описания новой цели
 * @returns {Promise.<void>}
 */
// async function setNewGoalOccupationMenu () {
//     return scenes.all.get('setNewGoalOccupationMenu')
// }

async function setNewGoalOccupationMenu () {
    MakeRequest('sendMessage', {
        text: i18n.t('scenes.goals.set_occupation.text')
    })
    // observer.setNextCallback('setNewGoalOccupationSubmit')
    return scenes.all.get('setNewGoalOccupationMenu')
}

async function setGoalContract () {
    MakeRequest('sendMessage', {
        text: 'Setting goal contract...'
    })
}

async function setGoalCommit () {
    MakeRequest('sendMessage', {
        text: 'Setting goal commit...'
    })
}

/**
 * Обработчик кнопки "Список целей"
 */
async function listAllGoalsHandler () {
    let opt = {
        external: true,
        method: 'GET'
    }
    MakeRequest('sendMessage', {
        text: 'Fetching goals data...'
    })
    return await MakeRequest('goals', opt)
        .then((response) => {
            let markup = []
            response.forEach((goal) => {
                markup.push([
                    {
                        text: goal.title,
                        callback_data: 'goal_id_' + goal.id
                    },
                ])
                scenes.all.set({
                    id: 'goal_id_' + goal.id,
                    key: '🛠 Goal ' + goal.id,
                    text: goal.text,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {id: 'setcontract'},
                                {id: 'setcommit'}
                            ],[
                                {id: 'listgoals'},
                            ]
                        ]
                    }
                })
            })
            markup.push([
                {id: 'newgoal'},
                {id: 'welcome', text: i18n.t('scenes.goals.back.button_text')}
            ])
            return {
                text: 'Your goals:',
                reply_markup: {
                    inline_keyboard: markup
                }
            }
        })
}

/**
 * Обработчик кнопки "Новая цель"
 */
async function createNewGoalHandler () {
    // Если еще не создавали - создаем пустой объект цели
    if (newGoal === null || typeof newGoal === 'undefined') {
        newGoal = new Goal()
    }

    // Выдали меню что делать дальше
    return scenes.all.get('newgoalmenu')

    /*
    let opt = {
        external: true,
        method: 'GET'
    }
    return await MakeRequest('goals', opt)
        .then((response) => {
            let markup = []
            response.forEach((goal) => {
                markup.push([
                    {
                        text: goal.title,
                        callback_data: 'goal_id_' + goal.id
                    },
                ])
                scenes.all.set({
                    id: 'goal_id_' + goal.id,
                    key: '🛠 Goal ' + goal.id,
                    text: goal.text,
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                scenes.all.get('setcontract'),
                                {text: `💵 Set commit`, callback_data: 'setcommit'}
                            ],[
                                {text: `⬅️ Back`, callback_data: 'listgoals'}
                            ]
                        ]
                    })
                })
            })
            markup.push([
                {text: `🧰 New goal`, callback_data: 'newgoal'},
                {text: `⬅️ Back`, callback_data: 'welcome'}
            ])
            return {
                text: 'Your goals:',
                reply_markup: JSON.stringify({
                    inline_keyboard: markup
                })
            }
        })*/
}

/**
 * Обработчик нажатия на ентер после ввода описания новой цели
 * @param msg
 * @returns {Promise.<void>}
 */
async function setNewGoalTitleSubmit (msg) {
    // Отправляем сообщение с подтверждением для проверки ввода:
    MakeRequest('sendMessage', {
        text: "ОК. Наименование новой цели:\r\n*" + msg.text + "*"
    })
    
    // Апдейтим кнопку с "описанием", добавляя туда галочку
    scenes.all.set({
        id: 'setNewGoalTitle',
        text: '✅️ ' + i18n.t('scenes.goals.set_title.button_text'),
        callback_data: setNewGoalTitle
    })
    // ... и апдейтим сцену с этой кнопкой
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
                    {id: 'welcome', text: i18n.t('scenes.back.button_text')}
                ]
            ]
        }
    })
    
    // Если еще не создавали - создаем пустой объект цели
    if (newGoal === null || typeof newGoal === 'undefined') {
        newGoal = new Goal()
    }

    // Фиксируем описание в объекте новой цели
    newGoal.set({title: msg.text})
    
    //
    return scenes.all.get('newgoalmenu')
}

/**
 * Обработчик нажатия на ентер после ввода описания новой цели
 * @param msg
 * @returns {Promise.<void>}
 */
async function setNewGoalDescriptionSubmit (msg) {
    // Отправляем сообщение с подтверждением для проверки ввода:
    MakeRequest('sendMessage', {
        text: "ОК. Описание новой цели:\r\n*" + msg.text + "*"
    })
    
    // Апдейтим кнопку с "описанием", добавляя туда галочку
    scenes.all.set({
        id: 'setNewGoalDescription',
        text: '✅️ ' + i18n.t('scenes.goals.set_description.button_text'),
        callback_data: setNewGoalDescription
    })
    // ... и апдейтим сцену с этой кнопкой
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
                    {id: 'welcome', text: i18n.t('scenes.back.button_text')}
                ]
            ]
        }
    })
    
    // Если еще не создавали - создаем пустой объект цели
    if (newGoal === null || typeof newGoal === 'undefined') {
        newGoal = new Goal()
    }
    
    // Фиксируем описание в объекте новой цели
    newGoal.set({text: msg.text})
    
    //
    return scenes.all.get('newgoalmenu')
}

/**
 * Обработчик нажатия на ентер после ввода описания новой цели
 * @param msg
 * @returns {Promise.<void>}
 */
async function setNewGoalOccupationSubmit (msg) {
    let choice = msg.text.replace(/^setNewGoalOccupation/, '').toLowerCase()
    if (occupationMenuMessageId === null) {
        occupationMenuMessageId = session.currentSession.get().last_message_id
        console.log('setting occ menu id as ', occupationMenuMessageId)
    }
    
    // Если еще не создавали - создаем пустой объект цели
    if (newGoal === null || typeof newGoal === 'undefined') {
        newGoal = new Goal()
    }
    
    let currentOccupation = newGoal.getContract().get().occupation
    currentOccupation.weekdays[choice] = !currentOccupation.weekdays[choice]
    
    let selection = Object.keys(currentOccupation.weekdays).filter((key) => {return currentOccupation.weekdays[key]===true})
    
    let globalCheck = selection.length>0 ? '✅' : '⭕'
    
    // Апдейтим кнопку с "описанием", добавляя туда галочку
    scenes.all.set({
        id: 'setNewGoalOccupation',
        text: globalCheck + i18n.t('scenes.goals.set_occupation.button_text'),
        callback_data: setNewGoalOccupationMenu
    })
    // ... и апдейтим сцену с этой кнопкой
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
                    {id: 'welcome', text: i18n.t('scenes.back.button_text')}
                ]
            ]
        }
    })
    
    let wd_idx = Object.keys(currentOccupation.weekdays).indexOf(choice)
    if (wd_idx >= 0) {
        let markup = scenes.all.get('setNewGoalOccupationMenu').reply_markup
        let check = currentOccupation.weekdays[choice] ? '✅' : '⭕'
        markup.inline_keyboard[0][wd_idx + 1].text = check + i18n.t('scenes.goals.set_occupation.' + choice)
    
        console.log('editing message', occupationMenuMessageId)
    
        MakeRequest('editMessageReplyMarkup', {
            message_id: occupationMenuMessageId,
            reply_markup: markup
        })
    }

    // // Отправляем сообщение с подтверждением для проверки ввода:
    // MakeRequest('sendMessage', {
    //     text: "ОК. Изменен вариант занятости по контракты:\r\n" + i18n.t('scenes.goals.set_occupation.' + choice)
    // })
    //
    // // Апдейтим кнопку с "описанием", добавляя туда галочку
    // scenes.all.set({
    //     id: 'setNewGoalDescription',
    //     text: '✅️ ' + i18n.t('scenes.goals.set_description.button_text'),
    //     callback_data: setNewGoalDescription
    // })
    // // ... и апдейтим сцену с этой кнопкой
    // scenes.all.set({
    //     id: 'newgoalmenu',
    //     key: i18n.t('scenes.goals.create_new.button_text'),
    //     text: i18n.t('scenes.goals.create_new.welcome_text'),
    //     reply_markup: {
    //         inline_keyboard: [
    //             [
    //                 {id: 'setNewGoalTitle'},
    //                 {id: 'setNewGoalDescription'},
    //                 {id: 'setNewGoalOccupation'},
    //             ], [
    //                 {id: 'welcome', text: i18n.t('scenes.back.button_text')}
    //             ]
    //         ]
    //     }
    // })
    //
    // // Фиксируем описание в объекте новой цели
    // newGoal.set({text: msg.text})
    
    //
    return {text: ''}//scenes.all.get('setNewGoalOccupationMenu')
}
