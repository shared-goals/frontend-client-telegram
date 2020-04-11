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
const Contract = __importDefault(require("./Contract"))

/**
 * Класс цели
 * @constructor
 */
function Goal (data) {
    let self = this
    data = data || {}
    
    self.attributes = {
        owner: null,
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
        yield req.make(ctx, 'goals/' + id, {
            method: 'GET'
        }).then( (response) => {
            self.set(response)
        })
    
        return self.set({
            contract: yield (new Contract.default()).findByGoalAndOwner(ctx, id, ctx.session.SGUser.get('id'))
        })
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
     *
     * @param ctx
     */
    self.save = async(ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (self.get('id') !== null) {
            // Отправляем запрос на получение информаии о цели
            yield req.make(ctx, 'goals/' + self.get('id'), Object.assign({}, self.get(), {
                method: 'PUT',
            })).then( (response) => {
                self.set(response)
            })
        }
    })
    
    self.set(data)
    
    return self
}

logger.default.debug(undefined, '🔸️  Goal model initiated')

exports.default = Goal;
