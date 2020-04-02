'use strict'

require('dotenv').config()

let Goal = require('../models/Goal').Goal
let Contract = require('../models/Contract').Contract
let defaults = require('../globals')
let logger = require('../modules/Logger').logger
let scenes = require('../modules/Scenes')
let session = require('../models/Session')
let observer = require('../modules/Observer').observer
let MakeRequest = require('../modules/Request').MakeRequest
let i18n = require('../modules/I18n')

let newGoal
let newContract


let controller = {
    
    mins_variants: ('m|min|mins|minutes|' + i18n.t('min_plur')).split('|'),
    hours_variants: ('h|hour|hours|' + i18n.t('hour_plur')).split('|'),
    
    /**
     * Проверяет валидность введенной строки занятости:
     * XXm|h every (day|mon|tue|...|week|month|XX,XX)
     * Примеры:
     *   10m every day
     *   3h every sat,sun
     *   10h every week
     * @param txt
     */
    validateOccupationFormat: (txt) => {
        let regStr = '^(\\d+)\\s*('
            + controller.mins_variants.join('|')
            + '|' + controller.hours_variants.join('|')
            + '|' + i18n.t('min_plur') + '|' + i18n.t('hour_plur') + ')'
            + '\\s+(every|' + i18n.t('every_plur') + ')\\s+(('
            + 'day|' + i18n.t('day')
            + '|week|' + i18n.t('week_plur')
            + '|month|' + i18n.t('month')
            + '|' + defaults.weekdays.join('|')
            + '|' + defaults.weekdays.map((item) => item.substr(0, 3)).join('|')
            + '|' + defaults.weekdays.map((item) => i18n.t(item)).join('|')
            + '|\\d+|\\d+,\\d+|,){1,13})$'
        // logger.info(regStr)
        let re = new RegExp(regStr, 'gi')
        let data = re.exec(txt)
        let ret
        if (data !== null) {
            ret = controller.parseOccupation(data.slice(1, 5))
        } else {
            ret = data
        }
        return ret
    },
    
    /**
     * Парсит исходный формат занятости и возвращает форматированный для хранения в БД
     * @param data введенный формат занятости. Пример: Array ['20', 'min', 'every', 'mon,sat]
     * @returns {{}}
     */
    parseOccupation: (data) => {
        let ret = {
            duration: null,
            week_days: [],
            month_days: []
        }

        if (controller.mins_variants.indexOf(data[1]) !== -1) {
            ret.duration = data[0]
        } else if (controller.hours_variants.indexOf(data[1]) !== -1) {
            ret.duration = data[0] * 60
        }
        
        let days = data[3].replace(/\s/, '').replace(/[;|]/, ',').split(',')
        
        let short_weekdays = defaults.weekdays.map((item) => item.substr(0, 3))
        let local_weekdays = defaults.weekdays.map((item) => i18n.t(item))
        
        days.forEach((day) => {
            if (day === 'day' || day === i18n.t('day')) {
                ret.week_days = short_weekdays
            } else if(day.match(/^\d+$/)) {
                ret.month_days.push(parseInt(day, 10))
            } else {
                let idx = defaults.weekdays.indexOf(day) !== -1
                    ? defaults.weekdays.indexOf(day)
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
    },
    
    stringifyOccupation: (data) => {
        return (data && data.hasOwnProperty('duration') && data.hasOwnProperty('duration') ?
            ((data.duration >= 60 ? (data.duration / 60) + 'h' : data.duration + 'min')
            + ' every ' + (data.week_days.length > 0 ? data.week_days.join(',') : data.month_days.join(',')))
        : 'не определен')
    },
    
    /**
     * Обработчик нажатия на кнопку "Наименование" в форме создания новой цели
     * @returns {Promise.<void>}
     */
    setNewGoalTitle: async() => {
        let newMsg = await MakeRequest('sendMessage', {
            text: i18n.t('scenes.goals.set_title.text')
        })
        if (newMsg && newMsg.result && newMsg.result.message_id) {
            scenes.all.setMessageId('setNewGoalTitleHint', newMsg.result.message_id)
        }
        observer.setNextCallback('setNewGoalTitleSubmit')
    },
    
    /**
     * Обработчик нажатия на кнопку "Описание" в форме создания новой цели
     * @returns {Promise.<void>}
     */
    setNewGoalDescription: async() => {
        let newMsg = await MakeRequest('sendMessage', {
            text: i18n.t('scenes.goals.set_description.text')
        })
        if (newMsg && newMsg.result && newMsg.result.message_id) {
            scenes.all.setMessageId('setNewGoalDescriptionHint', newMsg.result.message_id)
        }
        observer.setNextCallback('setNewGoalDescriptionSubmit')
    },
    
    /**
     * Обработчик нажатия на кнопку "Занятость" в форме создания новой цели
     * @returns {Promise.<void>}
     */
    setNewGoalOccupationMenu: async() => {
        let newMsg = await MakeRequest('sendMessage', {
            text: i18n.t('scenes.goals.set_occupation.text')
        })
        if (newMsg && newMsg.result && newMsg.result.message_id) {
            scenes.all.setMessageId('setNewGoalOccupationHint', newMsg.result.message_id)
        }
        observer.setNextCallback('setNewGoalOccupationSubmit')
    },
    
    setGoalContract: async() => {
        MakeRequest('sendMessage', {
            text: 'Setting goal contract...'
        })
    },
    
    setGoalCommit: async() => {
        MakeRequest('sendMessage', {
            text: 'Setting goal commit...'
        })
    },

    /**
     * Обработчик кнопки "Список целей"
     */
    listAllGoalsHandler: async() => {
        scenes.all.setMessageId('listGoals', session.currentSession.get().last_message_id)
    
        let newMsg = await MakeRequest('sendMessage', {
            text: i18n.t('scenes.goals.list_all.fetching')
        })
        
        let listGoalsMenuMessageId = null
        try {
            listGoalsMenuMessageId = newMsg.result.message_id
        } catch (err) {
            console.log(err)
        }
        if (listGoalsMenuMessageId !== null) {
            scenes.all.setMessageId('listGoals', listGoalsMenuMessageId)
            
            return await MakeRequest('users/' + session.currentSession.getUser().getId() + '/goals', {
                external: true,
                method: 'GET'
            })
                .then(async (response) => {
                    let markup = []
                    response.forEach(async(goal) => {
                        goal.contract = await MakeRequest(`goals/${goal.id}/contract`, {
                            external: true,
                            method: 'GET'
                        }).then((response) => {
                            response.string = controller.stringifyOccupation(response)
                            return response
                        })
                        console.log(JSON.stringify(goal))
                        markup.push([
                            {
                                text: goal.title,
                                callback_data: 'goal_id_' + goal.id
                            },
                        ])
                        scenes.all.set({
                            id: 'goal_id_' + goal.id,
                            key: '🛠 Goal ' + goal.id,
                            text: `_Наименование:_\r\n*    ${goal.title}*`
                                + `\r\n_Текст:_\r\n    ${goal.text}`
                                + `\r\n_Контракт:_\r\n    ${goal.contract.string}`
                                + `\r\n_Ссылка:_`, //\`\`\`    ${defaults.www.host}/goal${goal.id}\`\`\``,
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {text: defaults.www.host + `/goal${goal.id}`, url: defaults.www.host + `/goal${goal.id}`}
                                    ],[
                                        {id: 'setcontract'},
                                        {id: 'setcommit'}
                                    ],[
                                        {id: 'listgoals', text: i18n.t('scenes.goals.view_goal.back.button_text')},
                                    ]
                                ],
                                resize_keyboard: true
                            }
                        })
                    })
                    markup.push([
                        {id: 'welcome', text: i18n.t('scenes.back.button_text')}
                    ])
                    
                    await MakeRequest('editMessageText', {
                        message_id: listGoalsMenuMessageId,
                        text: i18n.t('scenes.goals.list_all.welcome_text')
                    })
                
                    await MakeRequest('editMessageReplyMarkup', {
                        message_id: listGoalsMenuMessageId,
                        text: 'OK',
                        reply_markup: {inline_keyboard: markup, resize_keyboard: true}
                    })
                
                    return {text: ''}
                
                    // return {
                    //     text: 'Your goals:',
                    //     reply_markup: {
                    //         inline_keyboard: markup
                    //     }
                    // }
                })
        }
    },
    
    /**
     * Обработчик кнопки "Новая цель"
     */
    createNewGoalMenu: async() => {
        // Если еще не создавали - создаем пустой объект цели
        if (newGoal === null || typeof newGoal === 'undefined') {
            newGoal = new Goal()
        }
    
        // Выводим форму с формой кнопок для ввода параметров новой цели
        let newMsg = await MakeRequest('sendMessage', scenes.all.get('newgoalmenu'))

        // Фиксируем ID сообщения с формой кнопок по созданию новой цели
        scenes.all.setMessageId('newGoalForm', newMsg.result.message_id)
    
        return null
    },
    
    /**
     * Обработчик кнопки "Отправить" - непосредственно отправка запроса за создание цели
     */
    setNewGoalSubmit: async() => {
        if (!newGoal) {
            logger.error('new goal object isn\'t defined')
            return null
        }
        if (!newContract) {
            logger.error('new contract object isn\'t defined')
            return null
        }
        let user = session.currentSession.get('user')
        if (!user) {
            logger.error('user isn\'t defined')
            return await MakeRequest('sendMessage', {
                text: i18n.t('errors.goals.user_not_defined')
            })
        }

        let ret = await MakeRequest('goals', {
            external: true,
            title: newGoal.get('title'),
            text: newGoal.get('text'),
            owner: { id: user.get('id')} ,
            method: 'POST'
        })
            .then((response) => {

                // Отправляем сообщение с подтверждением
                MakeRequest('sendMessage', {
                    text: "Цель создана"
                })
            
                return response
            })
    
        // Сетим айдишник цели в объекте контракта
        newContract.set({goal_id: ret.id})

        console.log('new goal', newGoal)
        console.log('new contract', newContract)
        console.log('sgapi response', ret)
    
        ret = await MakeRequest('contracts', {
            external: true,
            duration: newContract.get('duration'),
            week_days: newContract.get('week_days'),
            month_days: newContract.get('month_days'),
            owner: { id: user.get('id')} ,
            goal: { id: newContract.get('goal_id')} ,
            method: 'POST'
        })
            .then((response) => {
            
                // Отправляем сообщение с подтверждением
                MakeRequest('sendMessage', {
                    text: "Контракт подписан"
                })
            
                return response
            })
        
    
    
        return scenes.all.get('listallgoals')
    },
    
    /**
     * Обработчик нажатия на ентер после ввода описания новой цели
     * @param msg
     * @returns {Promise.<void>}
     */
    setNewGoalTitleSubmit: async(msg) => {
        // Удаляем введенное юзером сообщение
        await MakeRequest('deleteMessage', {
            message_id: session.currentSession.get().last_message_id
        })
    
        // Удаляем хинт для ввода
        await MakeRequest('deleteMessage', {
            message_id: scenes.all.getMessageId('setNewGoalTitleHint')
        })
    
        // Получаем конфигурацию формы кнопок создания новой цели
        let form = scenes.all.get('newgoalmenu').reply_markup
    
        // Апдейтим кнопку с "описанием", добавляя туда галочку
        form.inline_keyboard[0][0].text =
            defaults.icons.check.checked + i18n.t('scenes.goals.set_title.button_text')
    
        // Если еще не создавали - создаем пустой объект цели
        if (newGoal === null || typeof newGoal === 'undefined') {
            newGoal = new Goal()
        }
    
        // ... и фиксируем формат занятости в объекте новой цели
        newGoal.set({title: msg.text})
    
        // Обновляем форсму чтобы поменялись кнопки
        await MakeRequest('editMessageReplyMarkup', {
            message_id: scenes.all.getMessageId('newGoalForm'),
            reply_markup: form
        })
    
        return null
    },
    
    /**
     * Обработчик нажатия на ентер после ввода описания новой цели
     * @param msg
     * @returns {Promise.<void>}
     */
    setNewGoalDescriptionSubmit: async(msg) => {
        // Удаляем введенное юзером сообщение
        await MakeRequest('deleteMessage', {
            message_id: session.currentSession.get().last_message_id
        })
    
        // Удаляем хинт для ввода
        await MakeRequest('deleteMessage', {
            message_id: scenes.all.getMessageId('setNewGoalDescriptionHint')
        })
    
        // Получаем конфигурацию формы кнопок создания новой цели
        let form = scenes.all.get('newgoalmenu').reply_markup

        // Апдейтим кнопку с "описанием", добавляя туда галочку
        form.inline_keyboard[0][1].text =
            defaults.icons.check.checked + i18n.t('scenes.goals.set_description.button_text')

        // Если еще не создавали - создаем пустой объект цели
        if (newGoal === null || typeof newGoal === 'undefined') {
            newGoal = new Goal()
        }

        // ... и фиксируем описание в объекте новой цели
        newGoal.set({text: msg.text})

        // Обновляем форсму чтобы поменялись кнопки
        await MakeRequest('editMessageReplyMarkup', {
            message_id: scenes.all.getMessageId('newGoalForm'),
            reply_markup: form
        })
        
        return null
    },
    
    /**
     * Обработчик нажатия на ентер после ввода формата занятости по контракту новой цели
     * @param msg
     */
    setNewGoalOccupationSubmit: async(msg) => {
        // Удаляем введенное юзером сообщение
        await MakeRequest('deleteMessage', {
            message_id: session.currentSession.get().last_message_id
        })
    
        // Удаляем хинт для ввода
        await MakeRequest('deleteMessage', {
            message_id: scenes.all.getMessageId('setNewGoalOccupationHint')
        })
    
        // Валидируем введенную строку
        let correct = controller.validateOccupationFormat(msg.text)
        
        // Получаем конфигурацию формы кнопок создания новой цели
        let form = scenes.all.get('newgoalmenu').reply_markup

        // Если введено правильное значение
        if (correct) {
            // Апдейтим кнопку с "занятостью", добавляя туда галочку
            form.inline_keyboard[0][2].text =
                defaults.icons.check.checked + i18n.t('scenes.goals.set_occupation.button_text')
    
            // Если еще не создавали - создаем пустой объект цели
            if (newGoal === null || typeof newGoal === 'undefined') {
                newGoal = new Goal()
            }
    
            // Если еще не создавали - создаем пустой объект цели
            if (newContract === null || typeof newContract === 'undefined') {
                newContract = new Contract()
            }
    
            // ... и фиксируем формат занятости в объекте новой цели
            newGoal.setContract({occupation: correct})
            newContract.set(correct)
        } else {
            // Апдейтим кнопку с "занятостью", добавляя туда пустое поле
            form.inline_keyboard[0][2].text =
                defaults.icons.check.empty + i18n.t('scenes.goals.set_occupation.button_text')
        }
    
        // Обновляем форсму чтобы поменялись кнопки
        await MakeRequest('editMessageReplyMarkup', {
            message_id: scenes.all.getMessageId('newGoalForm'),
            reply_markup: form
        })
        
        return null
    
        // let choice = msg.text.replace(/^setNewGoalOccupation/, '').toLowerCase()
        //
        // if (occupationMenuMessageId === null) {
        //     occupationMenuMessageId = session.currentSession.get().last_message_id
        //     logger.info('setting occ menu id as ', occupationMenuMessageId)
        // }
        //
        // // Если еще не создавали - создаем пустой объект цели
        // if (newGoal === null || typeof newGoal === 'undefined') {
        //     newGoal = new Goal()
        // }
        //
        // let currentOccupation = newGoal.getContract().get().occupation
        // currentOccupation.weekdays[choice] = !currentOccupation.weekdays[choice]
        //
        // let selection = Object.keys(currentOccupation.weekdays).filter((key) => {return currentOccupation.weekdays[key]===true})
        //
        // let globalCheck = selection.length>0 ? defaults.icons.check.checked : defaults.icons.check.empty
        //
        // // Апдейтим кнопку с "описанием", добавляя туда галочку
        // scenes.all.set({
        //     id: 'setNewGoalOccupation',
        //     text: globalCheck + i18n.t('scenes.goals.set_occupation.button_text'),
        //     callback_data: controller.setNewGoalOccupationMenu
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
        // let wd_idx = Object.keys(currentOccupation.weekdays).indexOf(choice)
        // if (wd_idx >= 0) {
        //     let markup = scenes.all.get('setNewGoalOccupationMenu').reply_markup
        //     let check = currentOccupation.weekdays[choice] ? defaults.icons.check.checked : defaults.icons.check.empty
        //     markup.inline_keyboard[0][wd_idx + 1].text = check + i18n.t('scenes.goals.set_occupation.' + choice)
        //
        //     logger.info('editing message', occupationMenuMessageId)
        //
        //     MakeRequest('editMessageReplyMarkup', {
        //         message_id: occupationMenuMessageId,
        //         reply_markup: markup
        //     })
    }
}

module.exports = controller;