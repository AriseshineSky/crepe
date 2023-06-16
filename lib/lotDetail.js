const purchaseItemApi = require("../api/gerpgo/purchaseItem");
const Token = require("../api/token");

const authes = require("../api/gerpgo/auth");
const Delivery = require("../proxy").Delivery;
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

async function updateAllPurchaseOrder(token, salt) {
	let deliveries = await Delivery.all();
	const url = `${gerpgo_api_prefix}` + `${open_apis.lotNoDetailsView}`;

	for (let delivery of deliveries) {
		const data = {
			code: delivery.code,
		};
		let lotNoData = await purchaseItemApi(url, data, token, salt);
		if (lotNoData) {
			logger.info(`[lotNoDetailsView:]${JSON.stringify(lotNoData)}`);
			// const purchaseItem = parsePurchaseItem(purchaseItem);
			// await Purchase.createOrUpdate(purchase);
		}
	}
}

async function getLotDetails(token, salt) {
	await updateAllPurchaseOrder(token, salt);
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function syncLotNoDetails() {
	for (let auth of authes) {
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await getLotDetails(token, auth.appKey);
		await wait(2000);
	}
}

module.exports = {
	syncLotNoDetails,
};
