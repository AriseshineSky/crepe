const purchaseItemApi = require("../api/gerpgo/purchaseItem");
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

async function getProcureItemView(token, salt) {
	let purchases = await Purchase.all();
	const url = `${gerpgo_api_prefix}` + `${open_apis.procureItem}`;

	for (let purchase of purchases) {
		const data = {
			poCode: purchase.code,
		};
		let procureItem = await purchaseItemApi(url, data, token, salt);
		if (procureItem) {
			logger.info(`[procureItem:]${JSON.stringify(procureItem)}`);
			// const purchaseItem = parsePurchaseItem(purchaseItem);
			// await Purchase.createOrUpdate(purchase);
		}
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function getPurchaseProcuresByBatch(url, data, token, salt) {
	let purchaseProcures = await purchaseProcureApi(url, data, token, salt);
	if (purchaseProcures.data.rows) {
		for (let purchaseProcure of purchaseProcures.data.rows) {
			logger.info(JSON.stringify(purchaseProcure));
			// const purchase = parsePurchaseProcures(purchaseProcure);
			// await Purchase.createOrUpdate(purchase);
		}
		return "pending";
	} else {
		return "end";
	}
}

async function syncProcureItems() {
	for (let auth of authes) {
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await getProcureItemView(token, auth.appKey);
		await wait(2000);
	}
}

module.exports = {
	syncProcureItems,
};
