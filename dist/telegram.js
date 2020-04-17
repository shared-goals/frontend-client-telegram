"use strict";

Object.defineProperty(exports, "__esModule", { value: true })

const Telegraf = require("telegraf")
const telegram = new Telegraf.Telegram(process.env.TELEGRAM_TOKEN, {})

exports.default = telegram;
