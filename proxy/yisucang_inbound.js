const models = require("../models");
const Purchase = models.Purchase;
const YisucangInbound = models.YisucangInbound;

const helper = require("../lib/util/helper");
const batchSize = 200;

let sheetApi = require("./sheetApi");
let Product = require("./product");
let FreightType = models.Freight;

let moment = require("moment");
let logger = require("../common/logger");

async function formatFreightsAndProductings(freightsAndProducings) {
	let inboundShippeds = [];
	let producings = [];
	for (let freight of freightsAndProducings.freights) {
		inboundShippeds.push({
			quantity: freight.qty,
			orderId: freight.orderId,
			deliveryDue: freight.delivery,
			box: freight.box,
			shippedDate: freight.shippedDate,
			fba: freight.fba,
		});
	}
	for (let producing of freightsAndProducings.producings) {
		producings.push({
			orderId: producing.orderId,
			quantity: producing.qty,
			deliveryDue: producing.delivery,
			created: producing.created,
		});
	}
	return {
		inboundShippeds: inboundShippeds,
		producings: producings,
	};
}

function compare(type) {
	return function (m, n) {
		return m[type] - n[type];
	};
}

async function sortFreightsByDelivery(freights) {
	return freights.sort(compare("delivery"));
}
let sumFreights = async function (freights) {
	let sum = 0;
	for (let freight of freights) {
		sum += Number(freight.qty);
	}
	return sum;
};

let checkFreights = async function (freights, pendingStorageNumber) {
	freights = await sortFreightsByDelivery(freights);
	while (
		Number(pendingStorageNumber > 0) &&
		(await sumFreights(freights)) > Number(pendingStorageNumber)
	) {
		freights.shift();
	}
};

async function remvoeDuplicateYisucangInbounds(inbounds) {
	return inbounds.filter((elem, index, self) => {
		let count = 0;
		for (let inbound of inbounds) {
			if (inbound.number === elem.number) {
				count++;
			}
		}
		return count === 1;
	});
}

async function findYisucangInbounds(inbounds, freight) {
	return inbounds.filter((elem) => {
		return elem.orderId === freight.orderId;
	});
}

async function sortFreightsByDelivery(freights) {
	return freights.sort(compare("delivery"));
}
let countBoxes = async function (objects) {
	let sum = 0;
	for (let obj of objects) {
		sum += Number(obj.boxCount);
	}
	return sum;
};

async function removeFreight(freights, fba) {
	let only = true;
	for (let i = 0; i < freights.length; i++) {
		if (
			freights[i].fba === fba &&
			moment(freights[i].delivery).diff(moment(new Date()), "days") < 5
		) {
			only = false;
			freights.splice(i, 1);
			break;
		}
	}
	return only;
}
async function checkFreightsV2(freights, inbounds, recieved) {
	if (recieved) {
		return [];
	}
	freights = await sortFreightsByDelivery(freights);
	let originalBoxCount = await countBoxes(freights);
	let leftBoxes = originalBoxCount - (await countBoxes(inbounds));
	while ((await countBoxes(freights)) > leftBoxes && freights.length > 0) {
		if (await removeFreight(freights, false)) {
			break;
		}
	}
	return freights;
}

async function syncBoxInfo(freight, product) {
	if (!product.unitsPerBox || product.unitsPerBox === 1) {
		product.unitsPerBox = freight.box.units || product.unitsPerBox;
		product.box.length = freight.box.length || product.box.length;
		product.box.width = freight.box.width || product.box.width;
		product.box.height = freight.box.height || product.box.height;
		product.box.weight = freight.box.weight || product.box.weight;
	}
}
async function checkFreightBox(freight) {
	if (freight.box) {
		return (
			freight.box.units !== 1 &&
			freight.box.length !== 1 &&
			freight.box.width !== 1 &&
			freight.box.height !== 1 &&
			freight.box.weight !== 1
		);
	} else {
		return false;
	}
}
async function findFreightByType(freights, type) {
	return freights.find(function (freight) {
		return freight.type === type;
	});
}

async function matchFreightAndProducing(freight, producing) {
	return freight.orderId === producing.orderId;
}

async function addDefaultDeliveryToFreight(freight, types) {
	if (freight.type) {
		let freightType = await findFreightByType(types, freight.type);
	} else {
		let freightType = await findFreightByType(types, "seaExpress");
	}
	return moment(freight.shippedDate).add(freightType.period, "days");
}

async function getFreightsAndProductingsByProduct(product, days) {
	let freights = [];
	let producings = [];
	const types = await freightTypes();
	const freightApi = await Freight.getInstance();
	let allFreights = freightApi.freights;
	console.log(`allFreights: ${allFreights.length}`);
	const yisucangInbounds = await getYisucangInbounds();
	let purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
	console.log(`purchases: ${purchases.length}`);
	let syncBoxFlag = false;
	for (let j = 0; j < purchases.length; j++) {
		console.log(`checking: ${j + 1} purchase`);
		let unShippedAmount = purchases[j].qty;
		let producingFreights = [];
		for (let i = 0; i < allFreights.length; i++) {
			if (await matchFreightAndProducing(allFreights[i], purchases[j])) {
				producingFreights.push(allFreights[i]);
				if (!syncBoxFlag && (await checkFreightBox(allFreights[i]))) {
					syncBoxFlag = await syncBoxInfo(allFreights[i], product);
				}
				unShippedAmount -= allFreights[i].qty;
				if (!allFreights[i].delivery) {
				}
				if (moment(new Date()).diff(moment(allFreights[i].delivery), "days") < days) {
					freights.push(allFreights[i]);
				}
			}
		}

		if (
			unShippedAmount / purchases[j].qty > 0.15 &&
			moment(new Date()).diff(moment(purchases[j].created), "days") < 60
		) {
			producings.push({
				orderId: purchases[j].orderId,
				qty: unShippedAmount,
				delivery: purchases[j].us_arrival_date,
				created: purchases[j].created,
			});
		}
	}

	freights = await checkFreightsV2(freights, yisucangInbounds);

	return await formatFreightsAndProductings({
		freights: freights,
		producings: producings,
	});
}

async function getYisucangInboundsByOrderId(inbounds, orderId) {
	return inbounds.filter((elem) => {
		return elem.orderId === orderId;
	});
}

async function checkFreightRecived(recieveds, orderId) {
	for (let recived of recieveds) {
		if (recived.orderId === orderId) {
			return true;
		}
	}
	return false;
}

async function updateDeliveryReciveds() {
	let yisucangReciveds = await getYisucangReciveds();
	let deliveries = await Delivery.find();
	for (let delivery of deliveries) {
		const reciveds = yisucangReciveds.filter(
			(recived) => recived.orderId === delivery.purchaseCode,
		);
		const recivedBoxes = reciveds.reduce(
			(recivedBoxes, recived) => recivedBoxes + recived.boxCount,
			0,
		);
		delivery.recivedBoxes = recivedBoxes;
		delivery.unrecivedBoxes = delivery.totalBoxes - recivedBoxes;
		await delivery.save();
	}
}

async function getFreightsAndProductingsByProductV2(
	product,
	days,
	types,
	allFreights,
	yisucangInbounds,
	yisucangReciveds,
) {
	let freights = [];
	let producings = [];

	if (!allFreights) {
		allFreights = await syncFreights();
	}

	if (!yisucangInbounds) {
		yisucangInbounds = await getYisucangInbounds();
		yisucangInbounds = await remvoeDuplicateYisucangInbounds(yisucangInbounds);
	}

	if (!yisucangReciveds) {
		yisucangReciveds = await getYisucangReciveds();
		yisucangReciveds = await remvoeDuplicateYisucangInbounds(yisucangReciveds);
	}

	if (!types) {
		types = await freightTypes();
	}

	let purchases = await Purchase.getPurchasesByProductId(product.plwhsId);

	console.log(`purchases: ${purchases.length}`);

	for (let j = 0; j < purchases.length; j++) {
		let unShippedAmount = purchases[j].qty;
		let producingFreights = [];
		for (let i = 0; i < allFreights.length; i++) {
			if (await matchFreightAndProducing(allFreights[i], purchases[j])) {
				producingFreights.push(allFreights[i]);
				unShippedAmount -= allFreights[i].qty;
				if (!allFreights[i].delivery) {
					allFreights[i].delivery = await addDefaultDeliveryToFreight(allFreights[i], types);
				}
			}
		}

		producingFreights = await checkFreightsV2(
			producingFreights,
			await getYisucangInboundsByOrderId(yisucangInbounds, purchases[j].orderId),
			await checkFreightRecived(yisucangReciveds, purchases[j].orderId),
		);
		freights = freights.concat(producingFreights);

		let shipped = false;
		if (
			unShippedAmount / purchases[j].qty < 0.2 ||
			moment(new Date()).diff(moment(purchases[j].created), "days") > 60
		) {
			shipped = true;
		} else {
			producings.push({
				orderId: purchases[j].orderId,
				qty: unShippedAmount,
				delivery: purchases[j].us_arrival_date,
				created: purchases[j].created,
				inboundShippeds: producingFreights,
				shipped: shipped,
			});
		}
	}

	return await formatFreightsAndProductings({
		freights: await removeDeliveredFreights(freights, days, product),
		producings: producings,
	});
}

exports.getFreightsAndProductingsByProductV2 = getFreightsAndProductingsByProductV2;
let parseDate = async function (dateInfo) {
	if (dateInfo) {
		let re = /\d+月.*\d+号?/;
		let date = dateInfo.match(re);
		if (date) {
			if (moment(date[0], "MM月DD号").isAfter(moment("2023-10-01"))) {
				return moment(`2022-${date[0]}`, "YYYY-MM月DD号");
			} else {
				return moment(date[0], "MM月DD号");
			}
		} else {
			console.log("err", dateInfo);
		}
	}
};

let parseOrderId = async function (order) {
	if (order) {
		let re = /OR\d*/;
		let orderId = order.match(re);
		if (orderId) {
			return orderId[0];
		}
		re = /OR\d*/;
		orderId = order.match(re);
		if (orderId) {
			return orderId[0];
		}
	}
};

let parseQuantity = async function (quantity, boxInfo) {
	if (boxInfo) {
		let boxQtyRe = /\d+箱.*?\d+\/箱/;
		let diStr = boxInfo.match(boxQtyRe);
		if (diStr[0]) {
			let di = diStr[0].split(/[\*\×x]/);
			box = {
				length: Number(di[0]),
				width: Number(di[1]),
				height: Number(di[2]),
			};
		}
	}
};

let parseBox = async function (boxInfo) {
	let box = {
		length: 1,
		width: 1,
		height: 1,
		weight: 1,
		units: 1,
	};
	if (boxInfo) {
		let diRe = /[\d\.]+(\*|\×|x)[\d\.]+(\*|\×|x)[\d\.]+/;
		let diStr = boxInfo.match(diRe);
		if (diStr) {
			let di = diStr[0].split(/[\*\×x]/);
			box = {
				length: Number(di[0]),
				width: Number(di[1]),
				height: Number(di[2]),
			};
		} else {
			logger.info(diRe);
			logger.info(boxInfo);
		}

		let weightRe = /[\d\s\.]*(kg)/i;
		diStr = boxInfo.match(weightRe);
		if (diStr && diStr[0].match(/[\d\.]+/)) {
			box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
		} else {
			weightRe = /[\d\s\.]+\/箱/gi;
			let diStrs = boxInfo.matchAll(weightRe);
			for (let diStr of diStrs) {
				if (Number(diStr[0].match(/[\d\.]+/)[0]) < 30) {
					box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
				}
			}
		}

		if (!box.weight) {
			logger.error(weightRe);
			logger.error(boxInfo);
		}

		let unitsRe = /\d+(盒|瓶|套|付|PCS|个|件)?\/箱/;
		let unitsStr = boxInfo.match(unitsRe);
		if (unitsStr) {
			box.units = Number(unitsStr[0].match(/[\d]+/)[0]);
		} else {
			unitsRe = /[\d\s\.]+\/箱/gi;
			let unitsStrs = boxInfo.matchAll(unitsRe);
			for (let unitsStr of unitsStrs) {
				if (Number(unitsStr[0].match(/[\d]+/)[0]) > 30) {
					box.units = Number(unitsStr[0].match(/[\d]+/)[0]);
				}
			}
		}
		if (!box.units) {
			logger.error(unitsRe);
			logger.error(boxInfo);
		}

		for (let type in box) {
			if (isNaN(box[type])) {
				logger.error("boxInfo");
				logger.error(box);
				logger.error(boxInfo);
			}
		}
		return box;
	}
};

let parseBoxCount = async function (boxInfo) {
	let boxCount = 0;
	if (boxInfo) {
		let boxCountRe = /\d+箱/;
		let boxCountStr = boxInfo.match(boxCountRe);
		if (boxCountStr) {
			boxCount = Number(boxCountStr[0].match(/[\d]+/)[0]);
		}
	}
	return boxCount;
};

async function parseShippedDate(dateInfo) {
	if (dateInfo) {
		// return moment('1900/01/01').add(dateInfo, 'days');
		return moment(dateInfo, "YYYY/MM/DD");
	}
}

async function parseType(type) {
	if (type) {
		if (type.includes("海运")) {
			if (type.includes("限时达")) {
				return "seaExpress";
			} else {
				return "sea";
			}
		}

		if (type.includes("空运")) {
			if (type.includes("快递")) {
				return "airExpress";
			} else {
				return "airDelivery";
			}
		}
	}
}

async function parseFba(type) {
	if (type) {
		if (type.includes("FBA")) {
			return true;
		}
	}
	return false;
}

let parseRow = async function (
	row,
	orderIndex,
	deliveryIndex,
	deliveryDueIndex,
	qtyIndex,
	boxIndex,
	shippedDateIndex,
	typeIndex,
) {
	let delivery = null;
	if (row[deliveryIndex]) {
		delivery = await parseDate(row[deliveryIndex]);
	} else if (row[deliveryDueIndex]) {
		delivery = await parseDate(row[deliveryDueIndex]);
	}
	let box = await parseBox(row[boxIndex]);
	let boxCount = await parseBoxCount(row[boxIndex]);
	let shippedDate = await parseShippedDate(row[shippedDateIndex]);
	let orderId = await parseOrderId(row[orderIndex]);
	logger.debug("shippedDate", shippedDate, row[shippedDateIndex], shippedDateIndex, row);
	let type = await parseType(row[typeIndex]);
	let fba = await parseFba(row[typeIndex]);

	return {
		orderId: orderId,
		delivery: delivery,
		qty: row[qtyIndex],
		shippedDate: shippedDate,
		type: type,
		box: box,
		boxCount: boxCount,
		fba: fba,
	};
};

const TYPES = {
	空运: "airExpress",
	空派: "airDelivery",
	快船: "seaExpress",
	慢船: "sea",
};

async function freightTypes() {
	return await FreightType.find({});
}

async function parseYisucangRow(row, HEADER) {
	let number = row[HEADER.indexOf("入库单号")];
	let orderId = row[HEADER.indexOf("物流追踪单号")];
	let boxCount = Number(row[HEADER.indexOf("入库数量")]);
	let date = row[HEADER.indexOf("入库时间")];
	let unitsPerBox = Number(row[HEADER.indexOf("个数/箱")]);
	return {
		number,
		orderId,
		boxCount,
		unitsPerBox,
		quantity: boxCount * unitsPerBox,
		date,
	};
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

exports.getYisucangInbounds = getYisucangInbounds;

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

exports.getYisucangReciveds = getYisucangReciveds;

async function syncFreightTypes() {
	let rows = await sheetApi.listFreightTypes();
	logger.debug(rows);
	for (let row of rows) {
		if (row[0] in TYPES) {
			let freightTpye = await FreightType.findOne({ type: TYPES[row[0]] });
			logger.debug(" freightTpye", freightTpye);

			if (freightTpye) {
				freightTpye.period = Number(row[1]);
				freightTpye.price = Number(row[2]);
				freightTpye.save(function (error) {
					if (error) {
						logger.error(error);
					}
				});
			} else {
				freightTpye = new FreightType();
				freightTpye.type = TYPES[row[0]];
				freightTpye.period = Number(row[1]);
				freightTpye.price = Number(row[2]);
				logger.debug(freightTpye);
				freightTpye.save(function (error) {
					if (error) {
						logger.error(error);
					}
				});
			}
		}
	}
}

exports.syncDelivery = async function () {
	let yiProducts = await productsApi.deliveryProducts();
	let inventories = await inventoriesApi.inventories();

	for (let yiProduct of yiProducts) {
		let yiInventory = inventories.find(function (inventory) {
			return inventory.UPC == yiProduct.UPC;
		});
		if (yiInventory) {
			let product = await findOrCreate(yiProduct.ID.toString());
			console.log(yiInventory);
			product.stock = yiInventory.SumNumber;
			product.save();
		}
	}
};

async function getDeliveriesByBatch() {
	try {
		const totalCount = await Delivery.countDocuments({});
		const totalPage = Math.ceil(totalCount / batchSize);
		for (let page = 1; page <= totalPage; page++) {
			const deliveries = await Delivery.find({}, { deliveryCode: 1 })
				.skip((page - 1) * batchSize)
				.limit(batchSize);
			const deliveryCodes = deliveries.map((delivery) => delivery.deliveryCode);
		}
	} catch (error) {}
}

function getPurchaseCode(code) {
	if (!code) {
		return null;
	}
	return code.split("-")[0];
}

async function addDeliveryPurchaseId() {
	let deliveries = await Delivery.find({ purchase: { $exists: false } });
	for (let delivery of deliveries) {
		const purchase = await Purchase.findOne({ code: getPurchaseCode(delivery.memo) });
		if (purchase) {
			delivery.purchase = purchase._id;
			await delivery.save();
		}
	}
}

async function updateDeliveryPurchaseId() {
	let deliveries = await all();
	for (let delivery of deliveries) {
		const purchase = await Purchase.findOne({ orderId: getPurchaseCode(delivery.memo) });
		if (purchase) {
			delivery.purchase = purchase._id;
			await delivery.save();
		}
	}
}

async function createOrUpdate(inbound) {
	const existInbound = await YisucangInbound.findOne({
		number: inbound.number,
	});

	if (existInbound) {
		Object.assign(existInbound, inbound);
		await existInbound.save();
	} else {
		const newInbound = new YisucangInbound(inbound);
		await newInbound.save();
	}
}

module.exports = {
	createOrUpdate,
	getYisucangInbounds,
	getYisucangReciveds,
};
