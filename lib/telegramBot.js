const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '5895297375:AAHi6zLwa71HjlG6v6aHSFLWdATjYQRku_8';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
'1846747534'
const chatIds = [
  '1501831585'
]
async function sendReminderMessage(chatId, msg) {
  if(chatIds.indexOf(chatId) > -1) {
    console.log(chatId)
    console.log(bot.sendMessage(chatId, msg, {parse_mode: 'HTML'}));
    bot.sendMessage('330425740', msg, {parse_mode: 'HTML'});
  }
}

module.exports.sendReminderMessage = sendReminderMessage;