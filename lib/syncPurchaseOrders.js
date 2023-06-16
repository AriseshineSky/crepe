let purchaseProcureApi = require("../api/gerpgo/purchaseProcure");
const Token = require("../api/token");
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

async function getPurchaseProcures(token, salt) {
	const url = `${gerpgo_api_prefix}` + `${open_apis.purchaseProcure}`;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get purchase page: ", i);
		const data = {
			page: i,
			pagesize: 200,
		};
		state = await getPurchaseProcuresByBatch(url, data, token, salt);
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
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await getPurchaseProcures(token, auth.appKey);
		await wait(2000);
	}
}

module.exports = { syncPurchaseOrders };