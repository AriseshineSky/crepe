const GerpgoClient = require("../services/gerpgoClient");
const authes = require("../api/gerpgo/auth");
const Purchase = require("../proxy").Purchase;
const logger = require("../common/logger");
const helper = require("./util/helper");

async function getPurchasesDetail(gerpgoClient) {
	const url = open_apis.purchaseDetail;

	let purchases = await Purchase.all();
	for (let purchase of purchases) {
		const data = {
			poCode: purchase.code,
		};

		const res = await gerpgoClient.fetchPurchaseDetail(url, data);

		logger.info("[PurchaseOrders]" + JSON.stringify(res));

		if (res.data) {
			state = await parsePurchaseProcuresRes({
				code: purchase.code,
				...res.data.procureItemVos[0],
			});
		}
		await helper.wait(200);
	}
}

async function parsePurchaseProcuresRes(data) {
	logger.info("[PurchaseOrdersData]" + JSON.stringify(data));
	await Purchase.createOrUpdate(data);
}

async function syncPurchasesDetail() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);

		try {
			await getPurchasesDetail(gerpgoClient);
		} catch (error) {
			console.log(error);
		}
		await helper.wait(200);
	}
}

module.exports = { syncPurchasesDetail };
