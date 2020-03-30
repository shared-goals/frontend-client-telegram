'use strict'

require('dotenv').config()

let msgActions = require('../modules/MsgActions').msgActions
let MakeRequest = require('../modules/Common').MakeRequest


/**
 * Обработчик кнопки "List All Goals"
 */
async function listAllGoalsHandler (msg) {
    let opt = {
        chat_id: msg.from.id,
        external: true,
        method: 'GET'
    }
    // makeRequest('sendMessage', {
    //     chat_id: msg.from.id,
    //     text: 'Fetching goals data...'
    // })
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
                msgActions.set({
                    id: 'goal_id_' + goal.id,
                    key: '🛠 Goal ' + goal.id,
                    text: goal.text,
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {text: `🗂 Set contract`, callback_data: 'setGoalContract'},
                                {text: `💵 Set commit`, callback_data: 'setGoalCommit'}
                            ],[
                                {text: `⬅️ Back`, callback_data: 'listAllGoals'}
                            ]
                        ]
                    })
                })
            })
            markup.push([
                {text: `🧰 New goal`, callback_data:'createNewGoal'},
                {text: `⬅️ Back`, callback_data:'welcome'}
            ])
            return {
                chat_id: msg.from.id,
                text: 'Your goals:',
                reply_markup: JSON.stringify({
                    inline_keyboard: markup
                })
            }
        })
}

msgActions.set({
    id: 'goals',
    key: '🧰 Goals',
    text: 'What do you mean?',
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                {text: `🗂 List all`, callback_data: 'listAllGoals'},
                {text: `🧰 New goal`, callback_data:'createNewGoal'},
            ], [
                {text: `⬅️ Back`, callback_data:'welcome'}
            ]
        ]
    })
})

msgActions.set({
    id: 'listAllGoals',
    key: 'listAllGoals',
    callback_data: listAllGoalsHandler
})
