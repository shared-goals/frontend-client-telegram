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

const _logger = __importDefault(require("../util/logger"))
const session = __importDefault(require("../util/session"))
const req = __importDefault(require("../util/req"))

/**
 * Класс текущего пользователя
 * @constructor
 */
function User (data) {
    let self = this
    data = data || {}
    
    self.attributes = {
        createdAt: null,
        updatedAt: null,
        language: 'ru',
        username: '',
        email: '',
        password: '',
        name: '',
        telegram_id: null
    }
    
    self.set = (data) => {
        self.attributes = Object.assign({}, self.attributes, data)
    }
    
    self.get = (key) => {
        return key && typeof key !== 'undefined' ? self.attributes[key] : self.attributes
    }
    
    self.toJSON = () => {
        return JSON.stringify(self.attributes)
    }
    
    self.findById = async(id) => __awaiter(void 0, void 0, void 0, function* () {
        // Отправляем запрос на получение информаии о пользователе
        yield req.make(ctx, 'users/email/' + (ctx.from.username || ctx.from.id) + '@t.me', {
            external: true,
            method: 'GET'
        }).then( (response) => {
            self.set(response)
        })

        return self
    })
    
    self.set(data)
    
    return self
}

_logger.default.debug(undefined, '🔸️  User model initiated')

exports.default = User;