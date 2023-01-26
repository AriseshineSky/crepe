const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '5895297375:AAHi6zLwa71HjlG6v6aHSFLWdATjYQRku_8';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
const obj = {
  'chenjin':'1501831585',
  '@Deborahwork': '1825916151',
  'sky': '330425740',
  'sky2': '-880860758'
}
const userDone = {
  "1846747534": '@laotiework',
  "1870791817": 'Trenton'
}

const toDoChatIds = {
  "1707286948": '@shamus0043',
  "1867654661": '@bryanluo7',
  "1793088091": "@shawnworkv",
  "2144937453": "@JimmyChiu153"
}

const doneChatIds = [
  "1846747534",
  "1891576626",
  "1870791817",
  "1773792388",
  "1715419547",
  "1707286948",
  "1867654661"
]
const chatIds = [
]
var count = 0;
async function sendReminderMessage(chatId, msg) {
  // bot.sendMessage(obj.sky2, msg, {parse_mode: 'HTML'});
  if(chatIds.indexOf(chatId) > -1) {
    // if (chatId !== "1707286948") {
      bot.sendMessage(chatId, msg, {parse_mode: 'HTML'});
    // }
    
    bot.sendMessage("1707286948", msg, {parse_mode: 'HTML'});
    bot.sendMessage('330425740', msg, {parse_mode: 'HTML'});
  
    // console.log(bot.sendMessage(obj.sky2, msg, {parse_mode: 'HTML'}));
    
    // console.log(bot.sendMessage(obj.sky2, msg, {parse_mode: 'HTML'}));
    // bot.sendMessage('330425740', msg, {parse_mode: 'HTML'});
  }
}

module.exports.sendReminderMessage = sendReminderMessage;