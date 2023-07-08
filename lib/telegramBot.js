const TelegramBot = require("node-telegram-bot-api");
const helper = require("./util/helper");

// replace the value below with the Telegram token you receive from @BotFather
const token = "5895297375:AAHi6zLwa71HjlG6v6aHSFLWdATjYQRku_8";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
const obj = {
	chenjin: "1501831585",
	"@Deborahwork": "1825916151",
	sky: "330425740",
	sky2: "-880860758",
};
const userDone = {
	5103909609: "@laotiework",
	1870791817: "Trenton",
};

const toDoChatIds = {
	1707286948: "@shamus0043",
	1867654661: "@bryanluo7",
	1793088091: "@shawnworkv",
	2144937453: "@JimmyChiu153",
};

const doneChatIds = [
	"5103909609",
	"1891576626",
	"1870791817",
	"1773792388",
	"1715419547",
	"1707286948",
	"1867654661",
];
const chatIds = [];
var count = 0;
async function sendReminderMessage(chatId, msg) {
	await helper.wait(100);
	bot.sendMessage(chatId, msg, { parse_mode: "HTML" });
	await helper.wait(100);
	bot.sendMessage(obj.sky, msg, { parse_mode: "HTML" });
}

module.exports.sendReminderMessage = sendReminderMessage;
