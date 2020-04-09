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
    
    self.toJSON = () => {
        return JSON.stringify(self.attributes)
    }
    
    self.updateReadyState = (ctx) => {
        self.set({ready: helpers.validateOccupationFormat(ctx, self.get('occupation')) !== null})
    }
    
    self.set(data)
    
    return self
}

logger.default.debug(undefined, '🔸️  Contract model initiated')

exports.default = Contract;
