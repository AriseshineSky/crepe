const COUNTRYS = ["US", "CA", "EU"];
const getPm = require("../api/getPM");
var moment = require("moment");
var Product = require("../proxy").Product;
var ProductUpdator = require("../proxy").ProductUpdator;
var Listing = require("../proxy").Listing;
var logger = require("../common/logger");
var sheetApi = require("../api/sheetApi.js");
var bot = require("./telegramBot");
const userName = {
	5103909609: "@laotiework",
	1863805140: "@BobH153",
	1707286948: "@shamus0043",
	1715419547: "@mikevine2011",
	1891576626: "@joshyan",
	1870791817: "@trentonamz",
	1773792388: "@OliverVtime",
	144689092: "@bryanluo7",
	5200630130: "@Rachel2911",
	403318301: "@Jabez153",
	5716401642: "@Josiah0601",
	1498416128: "@pete_wang_biz",
	1825916151: "@Deborahwork",
	1501831585: "@Jayde_C",
	1793088091: "@shawnworkv",
	2144937453: "@JimmyChiu153",
	1865641476: "@DanielM120",
	1824301648: "@yolanda392766",
	1656576879: "@Janet7788",
};

async function checkProductNeedToCheck(product) {
	if (
		product.yisucangId == null ||
		product.yisucangId == undefined ||
		product.yisucangId == [] ||
		product.yisucangId == ""
	) {
		return false;
	}
	return true;
}

async function checkAllProducts(message) {
	var products = null;
	if (message) {
		products = await Product.find({ sales: { $gt: 2 } });
	} else {
		products = await Product.find();
	}
	console.log(`There are ${products.length} products need to be check`);
	for (var i = 0; i < products.length; i++) {
		if (products[i].asin && products[i].asin.startsWith("B")) {
			if (message && !(await checkProductNeedToCheck(products[i]))) {
				continue;
			}
			await checkProductByListing(products[i], i + 1, products.length, message);
		}
	}
}

async function getCountrisFromListing(listings) {
	var countries = [];

	for (var listing of listings) {
		if (listing.country && countries.indexOf(listing.country) < 0) {
			countries.push(listing.country);
		}
	}

	return countries;
}

async function checkProductByListing(product, index, total, message) {
	const productUpdator = new ProductUpdator(product);
	productUpdator.updateAll();
	logger.info(`total: ${total}, index: ${index}, asin: ${product.asin}`);
	const listings = await Listing.findByProduct(product);
	for (let country of product.countries) {
		await checkProductByCountry(product, listings, country, message);
	}
	await checkProductInventory(product, message);
}

async function inventoryShortageRecord(asin, country, data, totalDays, availableDays, message) {
	if (message) {
		sendInventoryMessage(asin, country, data, totalDays, availableDays);
	}
}
async function singleInventoryRecord(asin, country, account, data, message) {
	if (message) {
		sendAccountMessage(asin, country, account);
	}
}

var massage = {
	airExpress: "需要空运，请尽快申请采购",
	seaExpress: "快到快船截止时间，请尽快申请采购",
	sea: "快到慢船截止时间，请尽快申请采购",
};

async function sendInventoryMessage(asin, country, data, totalDays, availableDays) {
	var pm = await getPm(asin, country);
	var content = `${
		userName[pm.chat_id]
	}\t你的产品${asin}\t${country}\t 亚马逊库存只能再卖${Math.floor(totalDays)}天，请尽快发货\n`;
	bot.sendReminderMessage(pm.chat_id, content);
}

async function sendAccountMessage(asin, country, account) {
	getPm(asin, country).then(
		async function (pm) {
			var content = `${
				userName[pm.chat_id]
			}\t你的产品${asin}\t只有一个账号${account}，请尽快选择备用账号发货。`;
			bot.sendReminderMessage(pm.chat_id, content);
		},
		function (error) {
			console.log(error);
		},
	);
}

async function sendStockShortageMessage(product) {
	let pm = null;
	for (let country of product.countries) {
		pm = await getPm(product.asin, country);
		if (pm) {
			let content = `${userName[pm.chat_id]}\t你的产品${product.asin}\t Yisucang库存为${
				product.yisucangInventory
			}, PLWHS库存为${product.plwhsInventory},只够${Math.floor(
				(product.yisucangInventory + product.plwhsInventory) / product.ps,
			)}天销售 请尽快采购。`;
			await bot.sendReminderMessage(pm.chat_id, content);
			break;
		}
	}
}
const COUNTRIES = ["US", "CA", "UK"];
const obj = {
	chenjin: "1501831585",
	yaling: "1825916151",
	sky: "330425740",
	sky2: "-880860758",
};

const TYPES = {
	airExpress: "空运快递",
	airDelivery: "空派",
	seaExpress: "快船",
	sea: "慢船",
};
async function sendMessage(product) {
	var pm = null;
	for (let country of product.countries) {
		pm = await getPm(product.asin, country);
		if (pm) {
			break;
		}
	}
	const orderDueLength = product.orderDues.length;
	var content = `${userName[pm.chat_id]}\t你的产品${
		product.asin
	}\t<strong color="#FF0000">需要采购${product.quantityToPurchase.quantity}</strong>\t
    发${TYPES[product.orderDues[0].type]}采购截止时间${moment(product.orderDues[0].due).format(
		"YYYY-MM-DD",
	)}\t 
    发${TYPES[product.orderDues[orderDueLength - 1].type]}采购截止时间${moment(
		product.orderDues[orderDueLength - 1].due,
	).format("YYYY-MM-DD")}\n
    亚马逊现有库存${product.fbaInventory}\t
    运输中货物数量${product.undeliveredQty}\t
    采购中货物数量${product.unshippedQty}\t
    仓库库存${product.yisucangInventory + product.plwhsInventory}\t
		仓库库存可卖天数${Math.floor(
			(product.yisucangInventory + product.plwhsInventory) / product.sales,
		)}\t
    近七天平均销量${product.ps}\t
    计算使用平均销量${product.sales}\t
    采购数量计算依据为 ${product.maxAvgSales} x 90天
    生产周期${product.cycle}\t`;
	await bot.sendReminderMessage(pm.chat_id, content);
}

function inventoryCheckRecord(asin, type, quantity, orderDues, inventorySheet) {
	getPm(asin, "US").then(
		async function (pm) {
			var content = `${pm.name}\t${asin}\t${quantity.quantity}\t${orderDues["airExpress"]}\t${orderDues["airDelivery"]}\t${orderDues["seaExpress"]}\t${orderDues["sea"]}\t${massage[type]}\n`;
			await sheetApi.append(inventorySheet, content.split("\t"));
		},
		function (error) {
			console.log(error);
		},
	);
}

async function checkProductStockShortage(product) {
	if ((product.plwhsInventory + product.yisucangInventory) / product.ps < 30) {
		sendStockShortageMessage(product);
	}
}

async function checkProductInventory(product, message) {
	if (!message) {
		return;
	}
	let orderDue = product.orderDues[product.orderDues.length - 1];
	console.log("orderDue", orderDue);
	if (moment(orderDue.due).diff(moment(), "days") < 7) {
		sendMessage(product);
	}
}

async function checkProductInventoryShortage(data, period) {
	var availableDays = data.availableQuantity / data.sales;
	var totalDays =
		(data.availableQuantity +
			data.reservedFCProcessing +
			data.reservedFCTransfer +
			data.inboundShipped) /
		data.sales;
	var shortage = totalDays < period;
	return {
		shortage: shortage,
		availableDays: availableDays,
		totalDays: totalDays,
	};
}

async function getListingAccountsCountByCountry(listings, country, asin) {
	var count = 0;
	var singleAccount = null;
	for (var listing of listings) {
		if (listing.asin === asin && listing.country === country) {
			count++;
			singleAccount = listing.account;
		}
	}
	return {
		count: count,
		account: singleAccount,
	};
}

async function checkProductSingleInventory(data, listings, country, asin) {
	if (
		(country.toUpperCase() === "US" && data.sales > 30) ||
		(country.toUpperCase() === "CA" && data.sales > 15)
	) {
		var accountCounts = await getListingAccountsCountByCountry(listings, country, asin);
		if (accountCounts.count < 2) {
			return accountCounts.account;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

async function checkProductByCountry(product, listings, country, message) {
	var data = await Product.prepareFbaInventoryAndSalesByCountryV2(product.asin, country, listings);
	if (data.sales < 1) {
		return;
	} else {
		var status = await checkProductInventoryShortage(data, 30);
		if (status.shortage) {
			await inventoryShortageRecord(
				product.asin,
				country,
				data,
				status.totalDays,
				status.availableDays,
				message,
			);
		}
		var account = await checkProductSingleInventory(data, listings, country, product.asin);
		if (account) {
			await singleInventoryRecord(product.asin, country, account, data, message);
		}

		if (message) {
			checkProductStockShortage(product);
		}
	}
}

module.exports.updateProductsInventory = async function () {
	console.log("begin to check");
	await checkAllProducts(false);
};
module.exports.checkProductsInventory = async function () {
	await checkAllProducts(true);
};
module.exports.checkProductInventoryShortage = checkProductInventoryShortage;
module.exports.checkProductSingleInventory = checkProductSingleInventory;
module.exports.checkProductInventory = checkProductInventory;
