"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    });
}

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const helpers = require("./helpers")
const Goal = require("../../models/Goal")
const common = require("../../util/common")
const language = require("../../util/language")
const session = require("../../util/session")
const req = __importDefault(require("../../util/req"))

exports.languageChangeAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const langData = JSON.parse(ctx.callbackQuery.data)
    yield language.updateLanguage(ctx, langData.p)
    const accountConfirmKeyboard = helpers.getAccountConfirmKeyboard(ctx)
    accountConfirmKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.start.new_account'))
    // yield common.sleep(3)
    yield ctx.reply(ctx.i18n.t('scenes.start.bot_description'), accountConfirmKeyboard)
    yield ctx.answerCbQuery()
})

exports.newGoalCreateAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('scenes.start.bot_description')
})

exports.goalsListViewAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // scenes.all.setMessageId('listGoals', session.currentSession.get().last_message_id)
    
    // let newMsg = await MakeRequest('sendMessage', {
    //     text: i18n.t('scenes.goals.list_all.fetching')
    // })
    
    // let listGoalsMenuMessageId = null
    // try {
    //     listGoalsMenuMessageId = newMsg.result.message_id
    // } catch (err) {
    //     console.log(err)
    // }

    // if (listGoalsMenuMessageId !== null) {
    //     scenes.all.setMessageId('listGoals', listGoalsMenuMessageId)
    
    const goals = yield req.make(ctx, 'users/' + ctx.session.SGUser.id + '/goals', {
        method: 'GET'
    }).then(async (response) => {
        const goals = response

        await goals.forEach(async(goal) => {
            goal.contract = await req.make(ctx, `goals/${goal.id}/contract`, {
                method: 'GET'
            }).then((response) => {
                return Object.assign({}, response, {string: helpers.stringifyOccupation(response)})
            })
            
            /*
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
            })*/
        })
        
        return goals

        // await MakeRequest('editMessageText', {
        //     message_id: listGoalsMenuMessageId,
        //     text: i18n.t('scenes.goals.list_all.welcome_text')
        // })
        //
        // await MakeRequest('editMessageReplyMarkup', {
        //     message_id: listGoalsMenuMessageId,
        //     text: 'OK',
        //     reply_markup: {inline_keyboard: markup, resize_keyboard: true}
        // })
        
        // return {
        //     text: 'Your goals:',
        //     reply_markup: {
        //         inline_keyboard: markup
        //     }
        // }*/
    })
    
    yield ctx.reply(ctx.i18n.t('scenes.goals.list_all.welcome_text'))
    
    const goalsListKeyboard = helpers.goalsListKeyboard(goals)
    goalsListKeyboard.disable_web_page_preview = true
    yield ctx.reply(ctx.i18n.t('scenes.goals.your_goals'), goalsListKeyboard)
    yield ctx.answerCbQuery()
    
    // }
})

exports.goalViewAction = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const data = JSON.parse(ctx.callbackQuery.data)
    const goal = yield (new Goal.default()).findById(ctx, data.p).then((g) => {return g})
    
    const goalViewKeyboard = helpers.goalViewKeyboard(ctx, goal)
    goalViewKeyboard.disable_web_page_preview = true

    yield ctx.replyWithHTML(
        `<i>Наименование:</i>\r\n    <b>${goal.get('title')}</b>`
        + `\r\n<i>Текст:</i>\r\n    ${goal.get('text')}`
        + `\r\n<i>Контракт:</i>\r\n    ${goal.get('contract').string}`,
        goalViewKeyboard
    )
});