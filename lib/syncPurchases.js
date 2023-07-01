let purchaseProcureApi = require("../api/gerpgo/purchaseProcure");
const GerpgoClient = require("../services/gerpgoClient");
const authes = require("../api/gerpgo/auth");
const Purchase = require("../proxy").Purchase;
const logger = require("../common/logger");
const helper = require("./util/helper");

async function getPurchaseProcures(gerpgoClient) {
	const url = open_apis.purchase;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get purchase page: ", i);
		const data = {
			pageInfo: {
				page: i,
				pagesize: 500,
			},
		};
		const res = await gerpgoClient.fetchPurchases(url, data);

		logger.info("[PurchaseOrdersRes]" + JSON.stringify(res));
		if (res.data) {
			state = await parsePurchaseProcuresRes(res.data);
		}
		await helper.wait(500);
		i++;
	}
}

async function parsePurchaseProcuresRes(data) {
	if (data.rows) {
		for (let purchaseProcure of data.rows) {
			await Purchase.createOrUpdate(purchaseProcure);
		}
	} else {
		return "end";
	}
}

async function syncPurchaseProcures() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);
		try {
			await getPurchaseProcures(gerpgoClient);
		} catch (error) {
			console.log(error);
		}
		await helper.wait(200);
	}
}

module.exports = { syncPurchaseProcures };
