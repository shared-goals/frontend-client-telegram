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

const logger = __importDefault(require("../util/logger"))
const req = __importDefault(require("../util/req"))
const User = __importDefault(require("./User"))
const Contract = __importDefault(require("./Contract"))

/**
 * Класс цели
 * @constructor
 */
function Goal (data) {
    let self = this
    data = data || {}
    
    const ownerAndCodeDivider = '/'
    
    self.attributes = {
        owner: null,
        code: '',
        title: '',
        text: '',
        contract: new Contract.default(),
        archived: null,
        completed: null,
        createdAt: null,
        updatedAt: null
    }
    
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
        return self
    }
    
    self.get = (key) => {
        return key && typeof key !== 'undefined' ? self.attributes[key] : self.attributes
    }
    
    self.getLink = (ctx) => {
        return (self.get('code') && self.get('code')!==''
            ? `/viewgoal ` + self.get('owner').email.replace(/@.+/, '')
                + `${ownerAndCodeDivider}${self.get('code')}`
            : `/viewgoal ${self.get('id').substr(0, process.env.GOAL_HASH_LENGTH)}`)
    }
    
    self.toJSON = () => {
        return JSON.stringify(self.attributes)
    }
    
    /**
     * Возвращает объект всех целей выбранного или текущего пользователя
     *
     * @param ctx
     * @returns {*}
     */
    self.findAll = async(ctx, user_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield req.make(ctx, 'users/' + (user_id || ctx.session.SGUser.get('id')) + '/goals', {
            method: 'GET'
        }).then(async(response) => __awaiter(void 0, void 0, void 0, function* () {
            let goals = [], goal
            if (!response || response.length === 0) {
                logger.default.error(ctx, 'Нет целей')
                return null
            } else {
                for (let i = 0; i < response.length; i++) {
                    goal = (new Goal()).set(response[i])
                    goal.set({
                        contract: yield (new Contract.default())
                            .findByGoalAndOwner(ctx, goal.get('id'), ctx.session.SGUser.get('id'))
                    })
                    goals.push(goal)
                }
            }
            return goals
        }))
    })
    
    /**
     * Возвращает объект цели по ее идентификатору / пользователю и коду
     *
     * @param ctx
     * @param id
     */
    self.find = async(ctx, query) => __awaiter(void 0, void 0, void 0, function* () {
        const re = new RegExp('^(?<owner>[^' + ownerAndCodeDivider + '\\s]+)' + ownerAndCodeDivider + '(?<code>.+)$')
        const sub_matches = query.match(re)

        // Если запрос в виде <строка>/<строка> - считаем что это пользователь и код
        if (sub_matches && sub_matches.groups) {
            return yield self.findByOwnerAndCode(ctx, sub_matches.groups)
        } else {
            // Если query начинается с решетки - пробуем найти строку в поле кода цели
            if (query.match(new RegExp('^(me|@me|my)?\\s*' + ownerAndCodeDivider + '.+'))) {
                return yield self.findByOwnerAndCode(ctx, {
                    owner: ctx.session.SGUser.get('email').replace(/@.+/, ''),
                    code: query.replace(new RegExp('^.*' + ownerAndCodeDivider), '')
                })
            }
            // Иначе если ровно GOAL_HASH_LENGTH символов - считаем что это часть ее _id
            else {
                return yield self.findById(ctx, query)
            }
        }
    })
    
    /**
     * Возвращает объект цели по ее идентификатору
     *
     * @param ctx
     * @param id
     */
    self.findById = async(ctx, id) => __awaiter(void 0, void 0, void 0, function* () {
        // Отправляем запрос на получение информаии о цели
        const ret = yield req.make(ctx, 'goals/' + id, {
            method: 'GET'
        }).then( (response) => {
            return self.set(response)
        }).catch((reason) => {
            logger.default.error(reason)
            return false
        })
        if (ret !== false) {
            return self.set({
                contract: yield (new Contract.default()).findByGoalAndOwner(ctx, self.get('id'), ctx.session.SGUser.get('id'))
            })
        } else {
            return null
        }
    })
    
    /**
     * Возвращает объект цели по ее пользователю и коду
     *
     * @param ctx
     * @param data
     */
    self.findByOwnerAndCode = async(ctx, data) => __awaiter(void 0, void 0, void 0, function* () {
        let goals = []
        const owner = yield (new User.default().findByEmail(ctx,
            (data.owner === 'me' ? ctx.session.SGUser.get('email').replace(/@.+/, '') : data.owner) + '@t.me'))

        if (owner !== null) {
            goals = yield self.findAll(ctx, owner.get('id'))
            goals = (goals || []).filter((goal) => {
                return goal.get('code') === data.code
            })
        } else {
            logger.default.error(ctx, 'Ошибка. Пользователь ' + data.owner + ' не найден')
            ctx.reply('Ошибка. Пользователь ' + data.owner + ' не найден')
        }

        if (goals && goals.length === 1) {
            return goals[0]
        } else {
            logger.default.error(ctx, 'Ошибка получения целей по параметрам', JSON.stringify(data))
            return null
        }
    })
    
    /**
     *
     * @param ctx
     */
    self.updateReadyState = (ctx) => {
        self.set({ready:
            self.get('title') !== null && self.get('title') !== '' &&
            self.get('text') !== null && self.get('text') !== '' &&
            self.get('contract').get('ready') === true
        })
    }
    
    /**
     * Сохранение объекта в БД. Апдейт существующей записи или вставка новой
     * @param ctx
     */
    self.save = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
        // Определяем данные для вставки или апдейта
        const data = self.get()
        data.owner = { id: ctx.session.SGUser.get('id')}

        // Если был определен айдишник - это апдейт
        if (self.get('id') !== null && typeof self.get('id') !== 'undefined') {
            // Отправляем запрос на получение информаии о цели
            yield req.make(ctx, 'goals/' + self.get('id'), Object.assign({}, self.get(), {
                method: 'PUT',
            }))
            .then( (response) => {
                self.set(response)
            })
        // Если не был определен айдишник - это вставка
        } else {
            yield req.make(ctx, 'goals', Object.assign({}, self.get(), {
                method: 'POST',
            }))
            .then( (response) => {
                self.set(response)
            })
        }
        
        return self
    })
    
    self.set(data)
    
    return self
}

logger.default.debug(undefined, '🔸️  Goal model initiated')

exports.default = Goal;
