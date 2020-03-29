'use strict'

/**
 * Класс логгера
 * @constructor
 */
function Logger () {
    let self = this
    let logErrors = false
    function info (msg) {
        if (logErrors === true) {
            console.log(msg)
        }
    }
    function error (msg) {
        if (logErrors === true) {
            console.error(msg)
        }
    }
    function enable () {
        logErrors = true
        return self
    }
    function disable () {
        logErrors = false
        return self
    }
    self.enable = enable
    self.disable = disable
    self.info = info
    self.error = error
}

let logger = (new Logger).enable()

module.exports.logger = logger