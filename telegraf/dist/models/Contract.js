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
const helpers = __importDefault(require("../controllers/goals/helpers"))
const req = __importDefault(require("../util/req"))

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/**
 * Класс контракта к цели
 * @constructor
 */
function Contract (data) {
    let self = this
    data = data || {}
    
    self.attributes = {
        owner: null,
        goal: null,
        duration: 0,
        occupation: null,
        week_days: [],
        month_days: [],
        next_run: null,
        last_run: null,
        createdAt: null,
        updatedAt: null,
        ready: false
    }
    
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
    }
    
    self.get = (key) => {
        return key && typeof key !== 'undefined' ? self.attributes[key] : self.attributes
    }
    
    /**
     * Проверяет валидность введенной строки занятости:
     * XXm|h every (day|mon|tue|...|week|month|XX,XX)
     * Примеры:
     *   10m every day
     *   3h every sat,sun
     *   10h every week
     * @param ctx
     * @param txt
     */
    self.validateFormat = (ctx, txt) => {
        const mins_variants = ('m|min|mins|minutes|' + ctx.i18n.t('min_plur')).split('|')
        const hours_variants = ('h|hour|hours|' + ctx.i18n.t('hour_plur')).split('|')
        
        let regStr = '^(\\d+)\\s*('
            + mins_variants.join('|')
            + '|' + hours_variants.join('|')
            + '|' + ctx.i18n.t('min_plur') + '|' + ctx.i18n.t('hour_plur') + ')'
            + '\\s+(every|' + ctx.i18n.t('every_plur') + ')\\s+(('
            + 'day|' + ctx.i18n.t('day')
            + '|week|' + ctx.i18n.t('week_plur')
            + '|month|' + ctx.i18n.t('month')
            + '|' + weekdays.join('|')
            + '|' + weekdays.map((item) => item.substr(0, 3)).join('|')
            + '|' + weekdays.map((item) => ctx.i18n.t(item)).join('|')
            + '|\\d+|\\d+,\\d+|,){1,13})$'

        let re = new RegExp(regStr, 'gi')
        let data = re.exec(txt)
        let ret
        if (data !== null) {
            ret = self.parseText(ctx, data.slice(1, 5))
        } else {
            ret = data
        }
        return ret
    }
    
    /**
     * Парсит исходный формат занятости и возвращает форматированный для хранения в БД
     * @param ctx
     * @param data введенный формат занятости. Пример: Array ['20', 'min', 'every', 'mon,sat]
     * @returns {{}}
     */
    self.parseText = (ctx, data) => {
        const mins_variants = ('m|min|mins|minutes|' + ctx.i18n.t('min_plur')).split('|')
        const hours_variants = ('h|hour|hours|' + ctx.i18n.t('hour_plur')).split('|')
        
        let ret = {
            duration: null,
            week_days: [],
            month_days: []
        }
        
        if (mins_variants.indexOf(data[1]) !== -1) {
            ret.duration = data[0]
        } else if (hours_variants.indexOf(data[1]) !== -1) {
            ret.duration = data[0] * 60
        }
        
        let days = data[3].replace(/\s/, '').replace(/[;|]/, ',').split(',')
        
        let short_weekdays = weekdays.map((item) => item.substr(0, 3))
        let local_weekdays = weekdays.map((item) => ctx.i18n.t(item))
        
        days.forEach((day) => {
            if (day === 'day' || day === ctx.i18n.t('day')) {
                ret.week_days = short_weekdays
            } else if(day.match(/^\d+$/)) {
                ret.month_days.push(parseInt(day, 10))
            } else {
                let idx = weekdays.indexOf(day) !== -1
                    ? weekdays.indexOf(day)
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
    }
    
    /**
     * Возвращает строку параметров занятости по объекту их данных
     * @returns {string}
     */
    self.toString = () => {
        const duration = self.get('duration')
        const week_days = self.get('week_days')
        const month_days = self.get('month_days')
        return duration && (week_days || month_days) ?
            ((duration >= 60 ? (duration / 60) + 'h' : duration + 'min')
                + ' every ' + (week_days.length > 0 ? week_days.join(',') : month_days.join(','))) : null
    }
    
    /**
     *
     * @returns {string}
     */
    self.toJSON = () => {
        return JSON.stringify(self.attributes)
    }
    
    /**
     *
     * @param ctx
     * @param id
     */
    self.findById = async(ctx, id) => __awaiter(void 0, void 0, void 0, function* () {
        // Отправляем запрос на получение информаии о цели
        yield req.make(ctx, 'contract/' + id, {
            method: 'GET',
            
        }).then( (response) => {
            self.set(response)
        })
        
        return self
    })
    
    /**
     *
     * @param ctx
     * @param goal
     * @param owner
     */
    self.findByGoalAndOwner = async(ctx, goal, owner) => __awaiter(void 0, void 0, void 0, function* () {
        // Отправляем запрос на получение информаии о цели
        yield req.make(ctx, 'contracts/' + goal + '/' + owner, {
            method: 'GET',
        }).then( (response) => {
            self.set(response)
        })
        
        return self
    })
    
    /**
     *
     * @param ctx
     */
    self.updateReadyState = (ctx) => {
        self.set({ready: self.validateFormat(ctx, self.get('occupation')) !== null})
    }
    
    /**
     *
     * @param ctx
     */
    self.save = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (self.get('id') !== null && typeof self.get('id') !== 'undefined') {
            // Отправляем запрос на получение информаии о цели
            return yield req.make(ctx, 'contracts/' + self.get('id'), Object.assign({}, self.get(), {
                method: 'PUT',
            })).then( (response) => {
                return response
            })
        }
    })
}

logger.default.debug(undefined, '🔸️  Contract model initiated')

exports.default = Contract;
