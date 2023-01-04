const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '5895297375:AAHi6zLwa71HjlG6v6aHSFLWdATjYQRku_8';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

async function sendReminderMessage(chatId, msg) {
  bot.sendMessage(chatId, msg);
}
module.exports = sendReminderMessage;