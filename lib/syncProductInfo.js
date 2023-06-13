const purchaseItemApi = require("../api/gerpgo/purchaseItem");
const token = require("../api/token");

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

async function updateAllPurchaseOrder(token, salt) {
	let purchases = await Purchase.all();
	const url = `${gerpgo_api_prefix}` + `${open_apis.productInfo}`;

	for (let purchase of purchases) {
		const data = {
			code: purchase.code,
		};
		let purchaseItemData = await purchaseItemApi(url, data, token, salt);
		if (purchaseItemData) {
			logger.info(`[productInfo:]${JSON.stringify(purchaseItemData)}`);
			// const purchaseItem = parsePurchaseItem(purchaseItem);
			// await Purchase.createOrUpdate(purchase);
		}
	}
}

async function getProcureItemView(token, salt) {
	await updateAllPurchaseOrder(token, salt);
}

async function syncProductInfo() {
	token.getToken3(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
		async function (token) {
			await getProcureItemView(token, "6419b1fbe4b07fc573e5ec7e");
		},
		function (error) {
			console.log(error);
		},
	);
	setTimeout(async function () {
		token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
			async function (token) {
				await getProcureItemView(token, "62daace5e4b073604b7e0b27");
			},
			function (error) {
				console.log(error);
			},
		);
	}, 10000);
	setTimeout(async function () {
		token.getToken2(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
			async function (token) {
				await getProcureItemView(token, "6399d977e4b086e9ac8877e0");
			},
			function (error) {
				console.log(error);
			},
		);
	}, 20000);
}

module.exports = {
	syncProductInfo,
};
