const Purchase = require("../proxy").Purchase;
const YisucangInbound = require("../proxy").YisucangInbound;
const logger = require("../common/logger");
const helper = require("./util/helper");

const sheetApi = require("../proxy/sheetApi");

async function parseOrderId(orderNumber) {
	if (orderNumber) {
		let re = /OR\d*/;
		let orderId = orderNumber.match(re);
		if (orderId) {
			return orderId[0];
		}

		re = /PO\d*/;
		orderId = orderNumber.match(re);
		if (orderId) {
			return orderId[0];
		}
	}
}

async function parseYisucangRow(row, HEADER) {
	let number = row[HEADER.indexOf("入库单号")];
	let orderId = await parseOrderId(row[HEADER.indexOf("物流追踪单号")]);
	let boxCount = parseInt(row[HEADER.indexOf("入库数量")]);
	let unitsPerBox = parseInt(row[HEADER.indexOf("个数/箱")]);
	let date = row[HEADER.indexOf("入库时间")];
	let logisticsTrackingNumber = row[HEADER.indexOf("物流追踪单号")];
	return {
		number,
		orderId,
		boxCount,
		date,
		unitsPerBox,
		logisticsTrackingNumber,
	};
}

async function getYisucangReciveds() {
	let rows = await sheetApi.listRecieveds();
	const HEADER = rows.shift();
	recieveds = [];
	for (let row of rows) {
		if (row[0]) {
			recieveds.push(await parseYisucangRow(row, HEADER));
		}
	}
	return recieveds;
}

async function getYisucangInbounds() {
	let rows = await sheetApi.listInbounds();
	const HEADER = rows.shift();
	inbounds = [];
	for (let row of rows) {
		if (row[0]) {
			inbounds.push(await parseYisucangRow(row, HEADER));
		}
	}
	return inbounds;
}

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

async function syncYisucangInbounds() {
	const reciveds = await getYisucangReciveds();
	await helper.wait(2000);
	console.log(reciveds[0]);
	const inbounds = await getYisucangInbounds();
	reciveds.forEach((inbound) => {
		YisucangInbound.createOrUpdate(inbound);
	});
}

module.exports = { syncYisucangInbounds };
