"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
}

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const baseScene = __importDefault(require("telegraf/scenes/base"))
const actions = require("./actions")
const helpers = require("./helpers")
const logger = __importDefault(require("../../util/logger"))
const keyboards = require("../../util/keyboards")

const goals = new baseScene.default('goals')

goals.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Выберите действие', helpers.getInitKeyboard(ctx))
}))

goals.leave((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
}))

goals.action(/newGoalCreate/, actions.newGoalCreateAction)
goals.action(/goalsListView/, actions.goalsListViewAction)
goals.action(/goalView/, actions.goalViewAction)

// Обработка нажатий на кнопки, после которых должны быть инициированы вводы с клавиатуры
goals.action(/.+/, actions.newGoalAnyButtonAction)

// Обработка обычных вводов с клавиатуры
goals.hears(/.+/, actions.newGoalAnyButtonHandler)

logger.default.debug(undefined, '🔹️  Start controller initiated')

exports.default = goals;
