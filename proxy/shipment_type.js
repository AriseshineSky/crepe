const sheetApi = require("./sheetApi");
const larksuiteApi = require("../api/larksuite");
const Purchase = require("./purchases");
const Product = require("./product");
const models = require("../models");
const ShipmentType = models.ShipmentType;
const Freight = models.Freight;

const moment = require("moment");
const getStockByProduct = require("../lib/getStockByProduct");
const logger = require("../common/logger");
const HEADER = [
	"pm",
	"asin",
	"plwhsId",
	"yisucangId",
	"cycle",
	"maxAvgSales",
	"box.length",
	"box.width",
	"box.height",
	"unitsPerBox",
	"box.weight",
];
const PRODUCT_ATTR = ["asin", "plwhsId", "yisucangId", "cycle", "maxAvgSales", "unitsPerBox"];
const INBOUND_ATTR = ["deliveryDue", "quantity"];

const syncshipmentTypes = async function () {
	const shipmentTypes = [];
	// const rows = await larksuiteApi.listshipmentTypes();
	const rows = await sheetApi.listshipmentTypes();
	const header = rows.shift();
	const shippedDateIndex = header.indexOf("出货日期");
	const deliveryDueIndex = header.indexOf("预计到港时间");
	const deliveryIndex = header.indexOf("状态");
	const orderIndex = header.indexOf("系统订单");
	const qtyIndex = header.indexOf("出货数量");
	const boxIndex = header.indexOf("装箱信息");
	const typeIndex = header.indexOf("PM要求");

	for (let row of rows) {
		if (row[0] && row[1]) {
			let freight = await parseRow(
				row,
				orderIndex,
				deliveryIndex,
				deliveryDueIndex,
				qtyIndex,
				boxIndex,
				shippedDateIndex,
				typeIndex,
			);
			shipmentTypes.push(freight);
		}
	}
	return shipmentTypes;
};

async function all() {
	return await ShipmentType.find();
}
async function updateOrCreate(freight) {
	let existFreight = await Freight.findOne({ id: freight.id });
	if (existFreight) {
		Object.assign(existFreight, freight);
		await existFreight.save();
	} else {
		const newFreight = new Freight(freight);
		await newFreight.save();
	}
}
async function formatshipmentTypesAndProductings(shipmentTypesAndProducings) {
	const inboundShippeds = [];
	const producings = [];
	for (const freight of shipmentTypesAndProducings.shipmentTypes) {
		inboundShippeds.push({
			quantity: freight.qty,
			orderId: freight.orderId,
			deliveryDue: freight.delivery,
			box: freight.box,
			shippedDate: freight.shippedDate,
			fba: freight.fba,
		});
	}
	for (const producing of shipmentTypesAndProducings.producings) {
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

async function sortshipmentTypesByDelivery(shipmentTypes) {
	return shipmentTypes.sort(compare("delivery"));
}
const sumshipmentTypes = async function (shipmentTypes) {
	const sum = 0;
	for (const freight of shipmentTypes) {
		sum += Number(freight.qty);
	}
	return sum;
};

const checkshipmentTypes = async function (shipmentTypes, pendingStorageNumber) {
	shipmentTypes = await sortshipmentTypesByDelivery(shipmentTypes);
	while (
		Number(pendingStorageNumber > 0) &&
		(await sumshipmentTypes(shipmentTypes)) > Number(pendingStorageNumber)
	) {
		shipmentTypes.shift();
	}
};

async function remvoeDuplicateYisucangInbounds(inbounds) {
	return inbounds.filter((elem, index, self) => {
		const count = 0;
		for (const inbound of inbounds) {
			if (inbound.number === elem.number) {
				count++;
			}
		}
		return count === 1;
	});
}
async function all() {
	return await ShipmentType.find();
}

exports.remvoeDuplicateYisucangInbounds = remvoeDuplicateYisucangInbounds;

// async function removeDeliveredshipmentTypes(shipmentTypes, days, product) {
// 	const shipmentTypes = shipmentTypes.filter((shipmentType) => {
// 		return moment(new Date()).diff(moment(shipmentType.delivery), "days") < days;
// 	});
//
// 	const inboundShipped = await Product.getInboundShippedCount(product.asin);
// 	while ((await sumshipmentTypes(shipmentTypes)) > inboundShipped && shipmentTypes.length > 0) {
// 		if (await removeFreight(shipmentTypes, true)) {
// 			break;
// 		}
// 	}
// 	return shipmentTypes;
// }

async function findYisucangInbounds(inbounds, freight) {
	return inbounds.filter((elem) => {
		return elem.orderId === freight.orderId;
	});
}

async function sortshipmentTypesByDelivery(shipmentTypes) {
	return shipmentTypes.sort(compare("delivery"));
}
const countBoxes = async function (objects) {
	const sum = 0;
	for (const obj of objects) {
		sum += Number(obj.boxCount);
	}
	return sum;
};

async function removeFreight(shipmentTypes, fba) {
	const only = true;
	for (const i = 0; i < shipmentTypes.length; i++) {
		if (
			shipmentTypes[i].fba === fba &&
			moment(shipmentTypes[i].delivery).diff(moment(new Date()), "days") < 5
		) {
			only = false;
			shipmentTypes.splice(i, 1);
			break;
		}
	}
	return only;
}
async function checkshipmentTypesV2(shipmentTypes, inbounds, recieved) {
	if (recieved) {
		return [];
	}
	shipmentTypes = await sortshipmentTypesByDelivery(shipmentTypes);
	const originalBoxCount = await countBoxes(shipmentTypes);
	const leftBoxes = originalBoxCount - (await countBoxes(inbounds));
	while ((await countBoxes(shipmentTypes)) > leftBoxes && shipmentTypes.length > 0) {
		if (await removeFreight(shipmentTypes, false)) {
			break;
		}
	}
	return shipmentTypes;
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
async function findFreightByType(shipmentTypes, type) {
	return shipmentTypes.find(function (freight) {
		return freight.type === type;
	});
}

async function matchFreightAndProducing(freight, producing) {
	return freight.orderId === producing.orderId;
}

async function addDefaultDeliveryToFreight(freight, types) {
	if (freight.type) {
		const shipmentType = await findFreightByType(types, freight.type);
	} else {
		const shipmentType = await findFreightByType(types, "seaExpress");
	}
	return moment(freight.shippedDate).add(shipmentType.period, "days");
}
const getshipmentTypesAndProductingsByProduct = async function (product, days) {
	const shipmentTypes = [];
	const producings = [];
	const types = await shipmentTypes();
	const freightApi = await Freight.getInstance();
	const allshipmentTypes = freightApi.shipmentTypes;
	console.log(`allshipmentTypes: ${allshipmentTypes.length}`);
	const yisucangInbounds = await getYisucangInbounds();
	const purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
	console.log(`purchases: ${purchases.length}`);
	const syncBoxFlag = false;
	for (const j = 0; j < purchases.length; j++) {
		console.log(`checking: ${j + 1} purchase`);
		const unShippedAmount = purchases[j].qty;
		const producingshipmentTypes = [];
		for (const i = 0; i < allshipmentTypes.length; i++) {
			if (await matchFreightAndProducing(allshipmentTypes[i], purchases[j])) {
				producingshipmentTypes.push(allshipmentTypes[i]);
				if (!syncBoxFlag && (await checkFreightBox(allshipmentTypes[i]))) {
					syncBoxFlag = await syncBoxInfo(allshipmentTypes[i], product);
				}
				unShippedAmount -= allshipmentTypes[i].qty;
				if (!allshipmentTypes[i].delivery) {
				}
				if (moment(new Date()).diff(moment(allshipmentTypes[i].delivery), "days") < days) {
					shipmentTypes.push(allshipmentTypes[i]);
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

	shipmentTypes = await checkshipmentTypesV2(shipmentTypes, yisucangInbounds);

	return await formatshipmentTypesAndProductings({
		shipmentTypes: shipmentTypes,
		producings: producings,
	});
};

async function getYisucangInboundsByOrderId(inbounds, orderId) {
	return inbounds.filter((elem) => {
		return elem.orderId === orderId;
	});
}

async function checkFreightRecived(recieveds, orderId) {
	for (const recived of recieveds) {
		if (recived.orderId === orderId) {
			return true;
		}
	}
	return false;
}

const getshipmentTypesAndProductingsByProductV2 = async function (
	product,
	days,
	types,
	allshipmentTypes,
	yisucangInbounds,
	yisucangReciveds,
) {
	const shipmentTypes = [];
	const producings = [];

	if (!allshipmentTypes) {
		allshipmentTypes = await syncshipmentTypes();
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
		types = await shipmentTypes();
	}

	const purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
	console.log(`purchases: ${purchases.length}`);
	for (const j = 0; j < purchases.length; j++) {
		const unShippedAmount = purchases[j].qty;
		const producingshipmentTypes = [];
		for (const i = 0; i < allshipmentTypes.length; i++) {
			if (await matchFreightAndProducing(allshipmentTypes[i], purchases[j])) {
				producingshipmentTypes.push(allshipmentTypes[i]);
				unShippedAmount -= allshipmentTypes[i].qty;
				if (!allshipmentTypes[i].delivery) {
					allshipmentTypes[i].delivery = await addDefaultDeliveryToFreight(
						allshipmentTypes[i],
						types,
					);
				}
			}
		}

		producingshipmentTypes = await checkshipmentTypesV2(
			producingshipmentTypes,
			await getYisucangInboundsByOrderId(yisucangInbounds, purchases[j].orderId),
			await checkFreightRecived(yisucangReciveds, purchases[j].orderId),
		);
		shipmentTypes = shipmentTypes.concat(producingshipmentTypes);

		const shipped = false;
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
				inboundShippeds: producingshipmentTypes,
				shipped: shipped,
			});
		}
	}

	return await formatshipmentTypesAndProductings({
		shipmentTypes: await removeDeliveredshipmentTypes(shipmentTypes, days, product),
		producings: producings,
	});
};

exports.getshipmentTypesAndProductingsByProductV2 = getshipmentTypesAndProductingsByProductV2;
const parseDate = async function (dateInfo) {
	if (dateInfo) {
		const re = /\d+月.*\d+号?/;
		const date = dateInfo.match(re);
		if (date) {
			if (moment(date[0], "MM月DD号").isAfter(moment("2023-10-01"))) {
				return moment(`2022-${date[0]}`, "YYYY-MM月DD号");
			} else {
				return moment(date[0], "MM月DD号");
			}
		} else {
			console.log("err", dateInfo);
		}
		if (!date) {
			const dateRegex = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;
			const match = dateInfo.match(dateRegex);
			if (match) {
				const dateStr = `${match[1]}-${match[2]}-${match[3]}`; // 转换为 "YYYY-MM-DD" 格式
				const date = moment(dateStr, "YYYY-MM-DD").toDate(); // 使用 Moment.js 转换为日期对象			} else {
				return date;
			}
		}
	}
};

const parseOrderId = async function (orderId) {
	if (orderId) {
		let re = /(OR|PO)\d*/;
		orderId = orderId.match(re);
		if (orderId) {
			return orderId[0];
		}
	}
};

const parseQuantity = async function (quantity, boxInfo) {
	if (boxInfo) {
		const boxQtyRe = /\d+箱.*?\d+\/箱/;
		const diStr = boxInfo.match(boxQtyRe);
		if (diStr[0]) {
			const di = diStr[0].split(/[\*\×x]/);
			box = {
				length: Number(di[0]),
				width: Number(di[1]),
				height: Number(di[2]),
			};
		}
	}
};

const parseBox = async function (boxInfo) {
	const box = {
		length: 1,
		width: 1,
		height: 1,
		weight: 1,
		units: 1,
	};
	if (boxInfo) {
		const diRe = /[\d\.]+(\*|\×|x)[\d\.]+(\*|\×|x)[\d\.]+/;
		const diStr = boxInfo.match(diRe);
		if (diStr) {
			const di = diStr[0].split(/[\*\×x]/);
			box = {
				length: Number(di[0]),
				width: Number(di[1]),
				height: Number(di[2]),
			};
		} else {
			logger.info(diRe);
			logger.info(boxInfo);
		}

		const weightRe = /[\d\s\.]*(kg)/i;
		diStr = boxInfo.match(weightRe);
		if (diStr && diStr[0].match(/[\d\.]+/)) {
			box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
		} else {
			weightRe = /[\d\s\.]+\/箱/gi;
			const diStrs = boxInfo.matchAll(weightRe);
			for (const diStr of diStrs) {
				if (Number(diStr[0].match(/[\d\.]+/)[0]) < 30) {
					box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
				}
			}
		}

		if (!box.weight) {
			logger.error(weightRe);
			logger.error(boxInfo);
		}

		const unitsRe = /\d+(盒|瓶|套|付|PCS|个|件)?\/箱/;
		const unitsStr = boxInfo.match(unitsRe);
		if (unitsStr) {
			box.units = Number(unitsStr[0].match(/[\d]+/)[0]);
		} else {
			unitsRe = /[\d\s\.]+\/箱/gi;
			const unitsStrs = boxInfo.matchAll(unitsRe);
			for (const unitsStr of unitsStrs) {
				if (Number(unitsStr[0].match(/[\d]+/)[0]) > 30) {
					box.units = Number(unitsStr[0].match(/[\d]+/)[0]);
				}
			}
		}
		if (!box.units) {
			logger.error(unitsRe);
			logger.error(boxInfo);
		}

		for (const type in box) {
			if (isNaN(box[type])) {
				logger.error("boxInfo");
				logger.error(box);
				logger.error(boxInfo);
			}
		}
		return box;
	}
};

const parseBoxCount = async function (boxInfo) {
	const boxCount = 0;
	if (boxInfo) {
		const boxCountRe = /\d+箱/;
		const boxCountStr = boxInfo.match(boxCountRe);
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

const parseRow = async function (
	row,
	orderIndex,
	deliveryIndex,
	deliveryDueIndex,
	qtyIndex,
	boxIndex,
	shippedDateIndex,
	typeIndex,
) {
	const delivery = null;
	if (row[deliveryIndex]) {
		delivery = await parseDate(row[deliveryIndex]);
	} else if (row[deliveryDueIndex]) {
		delivery = await parseDate(row[deliveryDueIndex]);
	}
	const box = await parseBox(row[boxIndex]);
	const boxCount = await parseBoxCount(row[boxIndex]);
	const shippedDate = await parseShippedDate(row[shippedDateIndex]);
	const orderId = await parseOrderId(row[orderIndex]);
	logger.debug("shippedDate", shippedDate, row[shippedDateIndex], shippedDateIndex, row);
	const type = await parseType(row[typeIndex]);
	const fba = await parseFba(row[typeIndex]);

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

async function parseYisucangRow(row, HEADER) {
	const number = row[HEADER.indexOf("入库单号")];
	const orderId = await parseOrderId(row[HEADER.indexOf("物流追踪单号")]);
	const quantity = row[HEADER.indexOf("入库数量")];
	const date = row[HEADER.indexOf("入库时间")];
	return {
		number: number,
		orderId: orderId,
		boxCount: Number(quantity),
		date: date,
	};
}

async function getYisucangInbounds() {
	const rows = await sheetApi.listInbounds();
	const HEADER = rows.shift();
	inbounds = [];
	for (const row of rows) {
		if (row[0]) {
			inbounds.push(await parseYisucangRow(row, HEADER));
		}
	}
	return inbounds;
}

exports.getYisucangInbounds = getYisucangInbounds;

async function getYisucangReciveds() {
	const rows = await sheetApi.listRecieveds();
	const HEADER = rows.shift();
	recieveds = [];
	for (const row of rows) {
		if (row[0]) {
			recieveds.push(await parseYisucangRow(row, HEADER));
		}
	}
	return recieveds;
}

exports.getYisucangReciveds = getYisucangReciveds;

function sortByType(shipmentTypes) {
	let sanitizeTypes = [];

	const order = ["airExpress", "airDelivery", "seaExpress", "sea"];

	for (let type of shipmentTypes) {
		if (order.indexOf(type) > -1) {
			sanitizeTypes.push(type);
		}
	}

	return sanitizeTypes.sort((a, b) => {
		return order.indexOf(a) - order.indexOf(b);
	});
}

async function syncShipmentTypes() {
	const rows = await sheetApi.listShipmentTypes();
	logger.debug(rows);
	for (const row of rows) {
		if (row[0] in TYPES) {
			const freightTpye = await FreightType.findOne({ type: TYPES[row[0]] });
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

module.exports = {
	all,
	syncShipmentTypes,
	syncshipmentTypes,
	getshipmentTypesAndProductingsByProduct,
	TYPES,
	sortByType,
};
