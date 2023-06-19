let purchaseProcureApi = require("../api/gerpgo/purchaseProcure");
const GerpgoClient = require("../services/gerpgoClient");
const authes = require("../api/gerpgo/auth");
const Purchase = require("../proxy").Purchase;
const logger = require("../common/logger");

function parsePurchaseProcures(purchaseProcure) {
	const {
		id,
		memo,
		totalQuantity,
		invoicesStatus,
		unInboundQuantity,
		supervisorId,
		supplierCode,
		customCode,
		productName,
		orderTotalAmount,
		creator,
		paymentRate,
		updateTime,
		createTime,
		transportName,
		product,
		asin,
		code,
		deliveryStatur,
		fnsku,
		inboundQuantity,
		orderQuantity,
		actualQuantity,
		stock,
		sellerSku,
		inboundDetailsVoList,
	} = purchaseProcure;
	return {
		id,
		memo,
		totalQuantity,
		unInboundQuantity,
		paymentRate,
		supervisorId,
		supplierCode,
		customCode,
		productName,
		orderTotalAmount,
		creator,
		updateTime,
		createTime,
		transportName,
		product,
		asin,
		code,
		deliveryStatur,
		fnsku,
		inboundQuantity,
		orderQuantity,
		actualQuantity,
		stock,
		sellerSku,
		inboundDetailsVoList,
		invoicesStatus,
	};
}

async function getPurchaseProcures(gerpgoClient) {
	const url = open_apis.purchaseProcure;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get purchase page: ", i);
		const data = {
			page: i,
			pagesize: 200,
		};
		state = await gerpgoClient.fetchPurchases(url, data);
		await wait(200);
		i++;
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function getPurchaseProcuresByBatch(url, data, token, salt) {
	let purchaseProcures = await purchaseProcureApi(url, data, token, salt);
	if (purchaseProcures.data.rows && purchaseProcures.data.rows.length > 0) {
		for (let purchaseProcure of purchaseProcures.data.rows) {
			logger.info("[PurchaseOrders]" + JSON.stringify(purchaseProcure));
			// const purchase = parsePurchaseProcures(purchaseProcure);
			await Purchase.createOrUpdate(purchaseProcure);
		}
		return "pending";
	} else {
		return "end";
	}
}

async function syncPurchaseOrders() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);
		await getPurchaseProcures(gerpgoClient);
		await wait(2000);
	}
}

module.exports = { syncPurchaseOrders };
