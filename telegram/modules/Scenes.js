'use strict'


const sources = {}
const idByKeyMap = {}
let list = {}

/**
 * Класс интерфейсных скринов/экшнов/экранов/кнопок
 * @constructor
 */
function Scenes () {
    let self = this
    
    let set = (action) => {
        if (!action.hasOwnProperty('key') && action.hasOwnProperty('id')) {
            action.key = action.id
        }
        list[action.key] = action
        sources[action.key] = action
        idByKeyMap[action.id] = action.key
    }
    let get = (key) => {
        let ret = (typeof list[key] !== 'undefined' ? list[key] : list[idByKeyMap[key]])
        if (ret && ret.hasOwnProperty('reply_markup') && typeof ret.reply_markup === 'string') {
            ret.reply_markup = JSON.parse(ret.reply_markup)
        }
        return ret
    }
    let getBrief = (key, opts) => {
        opts = opts || {}
        let item = get(key)
        let txtField = opts.hasOwnProperty('use') ? opts.use : 'text'
        let text = opts.hasOwnProperty('text') ? opts.text : item[txtField]
        return typeof item !== 'undefined' ? {text: text, callback_data: item.id} : {}
    }
    let update = (key) => {
        list[key] = sources[key]
    }
    
    self.set = set
    self.get = get
    self.getBrief = getBrief
    self.update = update
}

let scenes = new Scenes()

console.log('🔹️  Scenes module initiated')

module.exports.all = scenes
module.exports.sources = sources