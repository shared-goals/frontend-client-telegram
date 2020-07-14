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
const session = __importDefault(require("../util/session"))
const api = require('sg-node-api')
const User = api.user
const req = api.req

/**
 * Проверяет текущие значения сессии по хэшу авторизации и SG-объекту пользователя.
 * При их отсутствии делает все необходимые запросы в SGAPI и сетит значения в сессию.
 *
 * @param ctx - Объект контекста
 * @param next - next-функция
 */
const getUserInfo = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Смотрим текущий хэш в сессии
    let hash = ctx.session.SGAuthToken
    
    const now = new Date().getTime()
    const newUser = new User({
        id: null,
        createdAt: now,
        updatedAt: now,
        language: ctx.session.language || 'ru',
        username: ctx.from.username,
        email: ctx.from.username + '@t.me',
        password: '' + ctx.from.id,
        name: ctx.from.first_name + ' ' + ctx.from.last_name,
        telegram_id: ctx.from.id
    })
    
    // Если его нет или он пустой
    if (hash === null || typeof hash === 'undefined' || hash === '' ) {
        // Посылаем запрос на /login/
        yield req.make(ctx, 'login', {
            method: 'POST',
            email: newUser.get('email'),
            password: newUser.get('password'),
            provider: 'telegram',
            username: newUser.get('username'),
            id: newUser.get('telegram_id')
        }).then((response) => {
            if (response.hasOwnProperty('token')) {
                logger.default.debug(ctx, 'Сессия авторизована, хэш: ', response.token)
        
                // ... значит логин произошел, фиксируем хэш в сессию
                session.saveToSession(ctx, 'SGAuthToken', response.token)
            }
            if (response.hasOwnProperty('user')) {
                // Сетим юзера в сессии
                newUser.set(response.user || {})
                session.saveToSession(ctx, 'user', newUser)
                logger.default.debug(ctx, 'Пользователь определен в сессии: ', ctx.session.user.toJSON())
            }
        }).catch((response) => {
            logger.default.debug(ctx, 'Сессия не авторизована, ошибка: ', response.message)
        })
        hash = ctx.session.SGAuthToken
    } else {
        logger.default.debug(ctx, 'Сессия авторизована, хэш: ', hash)
    }
    
    // Если в итоге хэш в сессии есть
    if (typeof hash === 'string' && hash.length > 0) {
    
        // Сетим токен в объект реквестера
        req.setSessionToken(hash)

        // Если объекта пользователя в сессии нет
        if (ctx.session.user === null || typeof ctx.session.user === 'undefined') {
            
            // Отправляем запрос на получение информаии о пользователе
            yield req.make(ctx,
                'users/email/' + (ctx.from.username || ctx.from.id) + '@t.me', {
                external: true,
                method: 'GET'
            }).then(async function (response) {
                // Сетим юзера в сессии
                newUser.set(response || {})
                session.saveToSession(ctx, 'user', newUser)
                logger.default.debug(ctx, 'Пользователь определен в сессии: ', ctx.session.user.toJSON())
            })
        } else {
            // Сетим юзера в объект реквестера
            req.setSessionUser(ctx.session.user)

            logger.default.debug(ctx, 'Пользователь определен в сессии: ', ctx.session.user.toJSON())
        }

        // ctx.reply('Пользователь определен')
    } else {
    
        // ctx.reply(ctx.i18n.t('scenes.start.registering_user'))
        logger.default.debug(ctx, 'Starting new user creation')
    
        yield req.make(ctx, 'register', {
            method: 'POST',
            email: newUser.get('email'),
            password: newUser.get('password'),
            provider: 'telegram',
            username: newUser.get('username'),
            id: newUser.get('telegram_id')
        }).then((response) => {
    
            logger.default.debug(ctx, 'New user has been created')
    
            newUser.set(response || {})
            session.saveToSession(ctx, 'user', newUser)
        
            // ctx.reply(ctx.i18n.t('scenes.start.user_registered', {username: ctx.from.username}))
        }).catch((response) => {
            logger.default.debug(ctx, 'Ошибка регистрации пользователя: ', response.message)
        })
    
        yield getUserInfo(ctx)

        // ctx.reply(ctx.i18n.t('errors.start.authorization_fail'))
    }
    
    return typeof next === 'function' ? next() : null
})

exports.getUserInfo = getUserInfo;
