'use strict'


/**
 * Класс интерфейсных скринов/экшнов/экранов/кнопок
 * @constructor
 */
function MsgActions () {
    this.list = {}
    this.idByKeyMap = {}
    this.set = (action) => {
        this.list[action.key] = action
        this.idByKeyMap[action.id] = action.key
    }
    this.get = (key) => {
        return (typeof this.list[key] !== 'undefined' ? this.list[key] : this.list[this.idByKeyMap[key]])
    }
}

let msgActions = new MsgActions

module.exports.msgActions = msgActions