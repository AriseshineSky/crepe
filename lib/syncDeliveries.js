var deliveryApi = require("../api/gerpgo/delivery");
var token = require("../api/token");

const Delivery = require("../proxy").Delivery;
const logger = require("../common/logger");

function parsePurchaseProcures(purchaseProcure) {
	const {
		id,
		memo,
		totalQuantity,
		unInboundQuantity,
		supervisorId,
		supplierCode,
		customCode,
		products,
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
	} = purchaseProcure;
	return {
		id,
		memo,
		totalQuantity,
		unInboundQuantity,
		supervisorId,
		supplierCode,
		customCode,
		products,
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
	};
}

async function getDeliveries(token, salt) {
	return new Promise(async (resolve, reject) => {
		var url = `${gerpgo_api_prefix}` + `${open_apis.delivery}`;
		var i = 1;
		var state = "begin";
		while (state !== "end") {
			// while (i < 2) {
			console.log("get delivery page: ", i);
			var data = {
				page: i,
				pagesize: 200,
				sort: "createdTime",
				order: "desc",
			};
			state = await getDeliveriesByBatch(url, data, token, salt);
			i++;
		}
	});
}

async function getDeliveriesByBatch(url, data, token, salt) {
	return new Promise(function (resolve, reject) {
		setTimeout(async function () {
			let purchaseProcures = await deliveryApi(url, data, token, salt);
			if (purchaseProcures.data.rows) {
				for (let purchaseProcure of purchaseProcures.data.rows) {
					logger.info(`[purchaseProcure:]${JSON.stringify(purchaseProcure)}`);
					const purchase = parsePurchaseProcures(purchaseProcure);
					await Delivery.findOrCreate(purchase);
				}
				resolve("pending");
			} else {
				resolve("end");
			}
		}, 1000);
	});
}

module.exports.syncDeliveries = async function () {
	token.getToken3(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
		async function (token) {
			await getDeliveries(token, "6419b1fbe4b07fc573e5ec7e");
		},
		function (error) {
			console.log(error);
		},
	);
	setTimeout(async function () {
		token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
			async function (token) {
				await getDeliveries(token, "62daace5e4b073604b7e0b27");
			},
			function (error) {
				console.log(error);
			},
		);
	}, 10000);
	setTimeout(async function () {
		token.getToken2(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
			async function (token) {
				await getDeliveries(token, "6399d977e4b086e9ac8877e0");
			},
			function (error) {
				console.log(error);
			},
		);
	}, 20000);
};
