"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const logger = __importDefault(require("./logger"))

/**
 * Saving data to the session
 * @param ctx - telegram context
 * @param field - field to store in
 * @param data - data to store
 */
function saveToSession(ctx, field, data) {
    logger.default.debug(ctx, 'Saving %s to session', field)
    ctx.session[field] = data
}

exports.saveToSession = saveToSession

/**
 * Removing data from the session
 * @param ctx - telegram context
 * @param field - field to delete
 */
function deleteFromSession(ctx, field) {
    logger.default.debug(ctx, 'Deleting %s from session', field)
    delete ctx.session[field]
}

exports.deleteFromSession = deleteFromSession;
