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

const telegram = __importDefault(require("../../telegram"))

/**
 * Sends a message to the admin
 * @param ctx - telegram context
 */
function sendMessage(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = `From: ${JSON.stringify(ctx.from)}.\n\nMessage: ${ctx.message.text}`
        yield telegram.default.sendMessage(process.env.ADMIN_ID, msg)
    })
}

exports.sendMessage = sendMessage;
