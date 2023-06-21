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

async function getPurchasesDetail(gerpgoClient) {
	const url = open_apis.purchaseDetail;

	let purchases = await Purchase.all();
	for (let purchase of purchases) {
		const data = {
			poCode: purchase.code,
		};

		const res = await gerpgoClient.fetchPurchaseDetail(url, data);
		if (res.data) {
			state = await parsePurchaseProcuresRes({
				code: purchase.code,
				procureItemVos: res.data.procureItemVos,
			});
		}
		await wait(200);
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function parsePurchaseProcuresRes(data) {
	logger.info("[PurchaseOrders]" + JSON.stringify(data));
	await Purchase.createOrUpdate(data);
}

async function syncPurchasesDetail() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);
		await getPurchasesDetail(gerpgoClient);
		await wait(2000);
	}
}

module.exports = { syncPurchasesDetail };
