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

const moment = __importDefault(require('moment'))

const common = __importDefault(require("../util/common"))
const logger = __importDefault(require("../util/logger"))
const req = __importDefault(require("../util/req"))

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
    
    /**
     *
     * @param data
     * @returns {Contract}
     */
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
        return self
    }
    
    /**
     *
     * @param key
     * @returns {*}
     */
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
            + '|' + common.weekdays.join('|')
            + '|' + common.short_weekdays.join('|')
            + '|' + common.weekdays.map((item) => ctx.i18n.t(item)).join('|')
            + '|\\d+|\\d+,\\d+|,){1,13})$'
        
        let re = new RegExp(regStr, 'gi')
        let data = re.exec(txt)
        let ret
        if (data !== null) {
            ret = self.parseText(ctx, data.slice(1, 5))
        } else {
            ret = null
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
    
        let local_weekdays = common.weekdays.map((item) => ctx.i18n.t(item))

        days.forEach((day) => {
            if (day === 'day' || day === ctx.i18n.t('day')) {
                ret.week_days = common.short_weekdays
            } else if(day.match(/^\d+$/)) {
                ret.month_days.push(parseInt(day, 10))
            } else {
                let idx = common.weekdays.indexOf(day) !== -1
                    ? common.weekdays.indexOf(day)
                    : (common.short_weekdays.indexOf(day) !== -1
                        ? common.short_weekdays.indexOf(day)
                        : (local_weekdays.indexOf(day) !== -1
                            ? local_weekdays.indexOf(day)
                            : null))
                if (idx !== null) {
                    ret.week_days.push(common.short_weekdays[idx])
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
                + ' every ' + (week_days.length > 0 ? (week_days.length === 7 ? 'day' : week_days.join(',')) : month_days.join(','))) : null
    }
    
    /**
     *
     * @returns {string}
     */
    self.toJSON = () => {
        return JSON.stringify(self.attributes)
    }
    
    /**
     * Возвращает дату сегодняшнего рабочего дня
     *
     * @returns {string}
     */
    self.calcLastRun = () => {
        return moment.default().format('YYYY-MM-DD')
    }
    
    /**
     * Вычисляет дату следующего рабочего дня по текущему контракту после сегодняшнего
     *
     * @returns {string}
     */
    self.calcNextRun = () => {
        let ret = null

        const days = {
            week: self.get('week_days') || [],
            month: self.get('month_days') || []
        }
        
        // Если указаны дни недели
        if (days.week.length > 0) {
            const currentWeekDayIdx = (moment.default().isoWeekday() - 1)

            // переделываем массив названий рабочих дней недели по контракту в массив индексов, например [0, 1, 5, 7]
            days.week = days.week.map((day) => common.short_weekdays.indexOf(day))
            
            // Создаем массив индексов оставшихся после сегодняшнего рабочих дней недели по контракту, например [5, 7]
            const restWeekDays = days.week.filter((day) => day > currentWeekDayIdx)
            
            // Если на этой неделе по контракту есть еще рабочие дни
            if (restWeekDays.length > 0) {
                // возвращаем дату следующего дня по контракту
                ret = moment.default().isoWeekday(restWeekDays[0] + 1)
            }
            
            // ..., или если на этой неделе больше не осталось рабочих дней по кнтракту
            else {
                // возвращаем дату следующего дня по контракту как первый день недели по контракту, но на след.неделе
                ret = moment.default().isoWeekday(days.week[0] + 1 + 7)
            }
        }
        
        // ..., или если указаны дни месяца
        else if (days.month.length > 0) {
            const currentDate = moment.default().date()
            
            // Создаем массив оставшихся после сегодняшнего рабочих дней месяца по контракту, например [21, 30]
            const restMonthDays = days.month.filter((day) => day > currentDate)
    
            // Если в этом месяце по контракту есть еще рабочие дни
            if (restMonthDays.length > 0) {
                // возвращаем дату следующего дня по контракту
                ret = moment.default().date(restMonthDays[0])
            }
    
            // ..., или если на этой неделе больше не осталось рабочих дней по контракту
            else {
                // возвращаем дату следующего дня по контракту как первый день месяца по контракту, но в след.месяце
                ret = moment.default().add(1, 'month').date(days.month[0])
            }
        }
        return ret ? ret.format('YYYY-MM-DD') : ret
    }
    
    /**
     *
     * @param ctx
     * @param id
     */
    self.findById = async(ctx, id) => __awaiter(void 0, void 0, void 0, function* () {
        // Отправляем запрос на получение информаии о цели
        yield req.make(ctx, 'contracts/' + id, {
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
        return yield req.make(ctx, 'contracts/' + goal + '/' + owner, {
            method: 'GET',
        }).then( (response) => {
            if (!response.error) {
                return self.set(response)
            } else {
                return null
            }
        }).catch( (reason) => {
            return null
        })
    })
    
    /**
     *
     * @param ctx
     */
    self.updateReadyState = (ctx) => {
        self.set({ready: self.validateFormat(ctx, self.get('occupation')) !== null})
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
            yield req.make(ctx, 'contracts/' + self.get('id'), Object.assign({}, self.get(), {
                method: 'PUT',
            }))
            .then( (response) => {
                self.set(response)
            })
        // Если не был определен айдишник - это вставка
        } else {
            yield req.make(ctx, 'contracts', Object.assign({}, self.get(), {
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

logger.default.debug(undefined, '🔸️  Contract model initiated')

exports.default = Contract;
