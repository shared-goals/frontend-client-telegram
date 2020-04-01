'use strict'

let logger = new Logger
let defaults = require('../globals')
defaults.log ? logger.enable() : logger.disable()


/**
 * Класс логгера
 * @constructor
 */
function Logger () {
    let self = this

    function info () {
        if (defaults.log === true) {
            let args = Array.prototype.slice.call(arguments)
            console.log.apply(console, args)
        }
    }
    function error (msg) {
        if (defaults.log === true) {
            let args = Array.prototype.slice.call(arguments)
            console.error.apply(console, args)
        }
    }
    function enable () {
        defaults.log = true
        return self
    }
    function disable () {
        defaults.log = false
        return self
    }
    self.enable = enable
    self.disable = disable
    self.info = info
    self.error = error
}

logger.info('🔹️  Logger module initiated')

module.exports.logger = logger