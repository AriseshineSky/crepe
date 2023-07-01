const GerpgoClient = require("../services/gerpgoClient");
const authes = require("../api/gerpgo/auth");
const helper = require("./util/helper");
const Delivery = require("../proxy").Delivery;
const logger = require("../common/logger");

async function getDeliveries(gerpgoClient) {
	const url = open_apis.delivery;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get delivery page: ", i);
		const data = {
			page: i,
			pagesize: 200,
		};

		const res = await gerpgoClient.fetchDeliveries(url, data);

		logger.info("[DeliveryRes]" + JSON.stringify(res));
		if (res.data) {
			state = await parseDeliveryRes(res.data);
		} else {
			break;
		}
		await helper.wait(500);
		i++;
	}
}

async function parseDeliveryRes(data) {
	if (data.rows.length > 0) {
		for (let deliveryRow of data.rows) {
			await Delivery.createOrUpdate(deliveryRow);
		}
		return "pending";
	} else {
		return "end";
	}
}

async function syncDeliveries() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);

		try {
			await getDeliveries(gerpgoClient);
		} catch (error) {
			console.log(error);
		}
		await helper.wait(200);
	}
}

module.exports = { syncDeliveries };
