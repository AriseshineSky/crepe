var deliveryApi = require("../api/gerpgo/delivery");

const authes = require("../api/gerpgo/auth");
const Token = require("../api/token");

const Delivery = require("../proxy").Delivery;
const logger = require("../common/logger");

function parseDelivery(deliveryRow) {
	const {
		id,
		actualAmount,
		actualAmountTime,
		actualArrivalDate,
		actualArrivePortDate,
		box,
		trackings,
		channelId,
		chargeUnitPrice,
		chargeWeight,
		chargeWeightUnit,
		code,
		confirmShipmentDate,
		creator,
		dlBusinessName,
		dlBusinessType,
		estimateArrivePortDate,
		estimatedAmount,
		memo,
		containerType,
		country,
		updateTime,
		createdAt,
		fbaWarehouse,
		flCodeList,
		importCompany,
		importCompanyName,
		createdTime,
		isShipment,
		payer,
		quantity,
		receiptDate,
		receivingAt,
		receiptQuantity,
		diffQuantity,
		supplierCode,
		expectArrivalDate,
		expectShipmentDate,
	} = deliveryRow;
	return {
		id,
		actualAmount,
		actualAmountTime,
		actualArrivalDate,
		actualArrivePortDate,
		box,
		channelId,
		trackings,
		createdTime,
		chargeUnitPrice,
		chargeWeight,
		chargeWeightUnit,
		code,
		confirmShipmentDate,
		containerType,
		country,
		updateTime,
		createdAt,
		creator,
		dlBusinessName,
		dlBusinessType,
		estimateArrivePortDate,
		estimatedAmount,
		expectArrivalDate,
		expectShipmentDate,
		fbaWarehouse,
		flCodeList,
		importCompany,
		importCompanyName,
		memo,
		isShipment,
		payer,
		quantity,
		receiptDate,
		receivingAt,
		receiptQuantity,
		diffQuantity,
		supplierCode,
	};
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function getDeliveries(token, salt) {
	const url = `${gerpgo_api_prefix}` + `${open_apis.delivery}`;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get delivery page: ", i);
		const data = {
			page: i,
			pagesize: 200,
			sort: "createdTime",
			order: "desc",
		};
		state = await getDeliveriesByBatch(url, data, token, salt);
		await wait(200);
		i++;
	}
}

async function updateDeliveryPurchaseId() {
	let deliveries = await Delivery.all();
}
async function getDeliveriesByBatch(url, data, token, salt) {
	let deliveryData = await deliveryApi(url, data, token, salt);
	logger.info(`[deliveryData:]${JSON.stringify(deliveryData)}`);
	if (deliveryData.data.rows.length > 0) {
		for (let deliveryRow of deliveryData.data.rows) {
			const delivery = parseDelivery(deliveryRow);
			await Delivery.createOrUpdate(delivery);
		}
		return "pending";
	} else {
		return "end";
	}
}

async function syncDeliveries() {
	for (let auth of authes) {
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await getDeliveries(token, auth.appKey);
		await wait(2000);
	}
}

module.exports = { syncDeliveries };
