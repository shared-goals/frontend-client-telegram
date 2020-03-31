'use strict'

let logger = new Logger
let defaults = require('../globals')
defaults.logErrors ? logger.enable() : logger.disable()


/**
 * Класс логгера
 * @constructor
 */
function Logger () {
    let self = this

    function info () {
        if (defaults.logErrors === true) {
            let args = Array.prototype.slice.call(arguments)
            console.log.apply(console, args)
        }
    }
    function error (msg) {
        if (defaults.logErrors === true) {
            let args = Array.prototype.slice.call(arguments)
            console.error.apply(console, args)
        }
    }
    function enable () {
        defaults.logErrors = true
        return self
    }
    function disable () {
        defaults.logErrors = false
        return self
    }
    self.enable = enable
    self.disable = disable
    self.info = info
    self.error = error
}

console.log('🔹️  Logger module initiated')

module.exports.logger = logger