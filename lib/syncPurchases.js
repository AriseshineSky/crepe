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
	const url = open_apis.purchase;
	let i = 1;
	let state = "begin";
	while (i < 2) {
		// while (state !== "end") {
		console.log("get purchase page: ", i);
		const data = {
			pageInfo: {
				page: i,
				pagesize: 500,
			},
		};
		const res = await gerpgoClient.fetchPurchases(url, data);
		if (res.data) {
			state = await parsePurchaseProcuresRes(res.data);
		}
		await wait(500);
		i++;
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function parsePurchaseProcuresRes(data) {
	if (data.rows) {
		for (let purchaseProcure of data.rows) {
			logger.info("[PurchaseOrders]" + JSON.stringify(purchaseProcure));

			const purchase = parsePurchaseProcures(purchaseProcure);
			await Purchase.createOrUpdate(purchaseProcure);
		}
	}

	return "end";
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

async function syncPurchaseProcures() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);
		await getPurchaseProcures(gerpgoClient);
		await wait(2000);
	}
}

module.exports = { syncPurchaseProcures };