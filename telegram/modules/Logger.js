'use strict'

let logger = new Logger

let logErrors = require('../globals').logErrors
logErrors ? logger.enable() : logger.disable()

/**
 * Класс логгера
 * @constructor
 */
function Logger () {
    let self = this

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

module.exports.logger = logger