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

/**
 * Класс коммита к контракту
 * @constructor
 */
function Commit (data) {
    let self = this
    data = data || {}
    
    self.attributes = {
        owner: null,
        contract: null,
        duration: 0,
        whats_next: null,
        whats_done: null,
        createdAt: null,
        updatedAt: null
    }
    
    /**
     *
     * @param data
     * @returns {Commit}
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
     *
     * @returns {string}
     */
    self.toJSON = () => {
        return JSON.stringify(self.attributes)
    }
    
    /**
     *
     * @returns {string}
     */
    self.plain = () => {
        const data = JSON.parse(self.toJSON())
        data.contract = JSON.parse(data.contract)
        return data
    }
    
    /**
     *
     * @param ctx
     * @param id
     */
    self.findById = async(ctx, id) => __awaiter(void 0, void 0, void 0, function* () {
        // Отправляем запрос на получение информаии о цели
        yield req.make(ctx, 'commits/' + id, {
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
        self.set({
            ready: self.get('duration') && self.get('duration') !== 0 && self.get('duration') !== ''
                && self.get('whats_done') !== ''
        })
    }
    
    /**
     * Сохранение объекта в БД. Апдейт существующей записи или вставка новой
     * @param ctx
     */
    self.save = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
        // Определяем данные для вставки или апдейта
        self.set({owner: { id: ctx.session.SGUser.get('id')}})
        const data = self.plain()
        console.log(data)
        
        // Если был определен айдишник - это апдейт
        if (self.get('id') !== null && typeof self.get('id') !== 'undefined') {
            // Отправляем запрос на получение информаии о цели
            yield req.make(ctx, 'commits/' + self.get('id'), Object.assign({}, data, {
                method: 'PUT',
            }))
            .then( (response) => {
                self.set(response)
            })
        // Если не был определен айдишник - это вставка
        } else {
            yield req.make(ctx, 'commits', Object.assign({}, data, {
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

logger.default.debug(undefined, '🔸️  Commit model initiated')

exports.default = Commit;
