const models = require("../models");
const Product = models.Product;
const User = require("./user");
const mongoose = require("mongoose");
const getPm = require("../api/getPM");
const helper = require("../lib/util/helper");
let moment = require("moment");
const GAP = 6;
let getFbaInventoryByASIN = require("../lib/getFbaInventoryByASIN");
let getPlwhsByProduct = require("../lib/getPlwhsByProduct");
let Freight = require("./freight");
const ProductUpdator = require("./product_updator");
let Listing = require("./listing");
let Yisucang = require("./yisucang");
let logger = require("../common/logger");
const mysql = require("mysql2");
const { Delivery } = require(".");

async function getInboundShippedCount(asin) {
	let shipped = 0;
	let listings = await Listing.findLisingsByAsin(asin);
	for (let listing of listings) {
		shipped += listing.inboundShipped;
	}
	return shipped;
}

exports.getInboundShippedCount = getInboundShippedCount;

async function getFreight(product) {
	Freight.getFreightsAndProductingsByProduct(product);
}

async function checkProducings(product, freightsAndProducings) {
	for (let j = 0; j < freightsAndProducings.producings.length; j++) {
		for (let i = 0; i < product.producings.length; i++) {
			if (product.producings[i].orderId === freightsAndProducings.producings[j].orderId) {
				freightsAndProducings.producings[j].deliveryDue = product.producings[i].deliveryDue;
				freightsAndProducings.producings[j].deletedAt = product.producings[i].deletedAt;
			}
		}
	}
}

async function getProducingsQuantity(producings) {
	let quantity = 0;
	if (producings) {
		for (let i = 0; i < producings.length; i++) {
			quantity += producings[i].quantity;
		}
	}
	return quantity;
}

async function syncFreight(product, days) {
	// let freightsAndProducings = await Freight.getFreightsAndProductingsByProduct(product, days);
	let freightsAndProducings = await Freight.getFreightsAndProductingsByProductV2(product, days);
	await checkProducings(product, freightsAndProducings);
	product.inboundShippeds = freightsAndProducings.inboundShippeds;
	product.producings = freightsAndProducings.producings;
	product.purchase = await getProducingsQuantity(product.producings);
}

async function syncAllProductFreights(days) {
	let products = await Product.find();
	const types = await Freight.freightTypes();
	const allFreights = await Freight.syncFreights();
	const yisucangInbounds = await Freight.getYisucangInbounds();
	let inbounds = await Freight.remvoeDuplicateYisucangInbounds(yisucangInbounds);
	const yisucangReciveds = await Freight.getYisucangReciveds();
	let recieveds = await Freight.remvoeDuplicateYisucangInbounds(yisucangReciveds);
	for (let product of products) {
		let freightsAndProducings = await Freight.getFreightsAndProductingsByProductV2(
			product,
			days,
			types,
			allFreights,
			inbounds,
			recieveds,
		);
		await checkProducings(product, freightsAndProducings);
		product.inboundShippeds = freightsAndProducings.inboundShippeds;
		product.producings = freightsAndProducings.producings;
		product.purchase = await getProducingsQuantity(product.producings);
		await save(product);
	}
}
exports.syncAllProductFreights = syncAllProductFreights;
exports.syncFreight = syncFreight;
exports.getFreight = getFreight;

async function checkStatus(inbound, units, sales) {
	return units - inbound.period * sales.minAvgSales;
}

async function getDatabaseConnection() {
	const connection = mysql.createConnection({
		host: "mysql",
		port: 3306,
		user: "root",
		password: "root",
		database: "pl_warehouse",
	});
	connection.connect((error) => {
		console.log(error);
	});
	return connection;
}

exports.removeProductsWithoutAsinOrPlwhsId = async () => {
	Product.deleteMany({ $or: [{ asin: null }, { asin: { $eq: "" } }] });
	Product.deleteMany({ plwhsId: null });
};

async function syncFromPlwhs() {
	Product.deleteMany({ $or: [{ asin: null }, { asin: { $eq: "" } }] });
	let pro = await Product.find({ $or: [{ asin: null }, { asin: { $eq: "" } }] });
	console.log("pro", pro);
	const connection = await getDatabaseConnection();
	connection.query("SELECT * FROM Product;", async (error, results, fields) => {
		if (error) {
			console.log(error);
			// throw error;
		}
		for (let product of results) {
			let savedProduct = await Product.findOne({ plwhsId: product.id });
			const user = await User.findByPlwhsId(product.appUserId);
			if (!user) {
				continue;
			}
			if (!savedProduct) {
				let newProduct = await Product.create({
					plwhsId: product.id,
					asin: product.asin,
					pm: user.id,
				});
				console.log(newProduct);
			} else {
				if (!savedProduct.pm) {
					savedProduct.pm = user.id;
					savedProduct.save();
				}
			}
		}
	});
}
exports.syncFromPlwhs = syncFromPlwhs;

async function syncPmByProduct(productId) {
	let product = await getProductById(productId);
	for (let country of product.countries) {
		let user = await getPm(product.asin, country.toUpperCase());
		if (user && user !== "unknown") {
			user.username = user.name;
			let pm = await User.findOrCreate(user);
			User.updateUser(user);
			product.pm = pm;
			await save(product);
			return;
		}
	}
}
exports.syncPmByProduct = syncPmByProduct;

async function syncPm() {
	// const connection = mysql.createConnection({
	// 	host: "mysql",
	// 	port: 3306,
	// 	user: "root",
	// 	password: "root",
	// 	database: "pl_warehouse",
	// });
	// connection.connect((error) => {
	// 	console.log(error);
	// });
	// connection.query("SELECT * FROM AppUser;", async (error, results, fields) => {
	// 	if (error) {
	// 		console.log(error);
	// 		// throw error;
	// 	}
	// 	console.log(results);
	// 	for (let user of results) {
	// 		await User.findOrCreate(user);
	// 	}
	// });
	let products = await Product.find();
	for (let product of products) {
		for (let country of product.countries) {
			let user = await getPm(product.asin, country.toUpperCase());
			if (user) {
				let pm = await User.findOrCreate(user);
				User.updateUser(user);
				product.pm = pm;
				await product.save();
				return;
			}
		}
	}
}
exports.syncPm = syncPm;

function compare(type) {
	return function (m, n) {
		return m[type] - n[type];
	};
}

async function sortQueue(inboundQueue) {
	return inboundQueue.sort(compare("period"));
}

async function calculateInboundQueue(inbounds, sales) {
	let inboundQueue = [];
	inboundQueue[0] = {
		period: inbounds[0].period,
		inventory: {
			before: inbounds[0].quantity,
			after: inbounds[0].quantity,
		},
	};
	for (let i = 1; i < inbounds.length; i++) {
		let units = 0;
		for (let j = 0; j < i; j++) {
			units += inbounds[j].quantity;
		}
		let items = await checkStatus(inbounds[i], units, sales);
		inboundQueue[i] = {
			period: inbounds[i].period,
			inventory: {
				before: items,
				after: items + inbounds[i].quantity,
			},
		};
	}
	return inboundQueue;
}

async function calculateOutOfStockPeriod(status) {
	let period = 0;

	for (let i = 0; i < status.length - 1; i++) {
		if (status[i].before === 0 && status[i].after === 0) {
			period += status[i + 1].period - status[i].period + 1;
		}
	}
	return period;
}

async function calculateMinInventory(freightType, status, sales, product, gap) {
	let period = 0;
	let minInventory = 100000;
	let type = freightType[0];
	let freight = await findFreightByType(type);
	// 如果存在断货，检查空运到货之后的最小库存
	// 如果不存在断货，检查所有时刻最小库存
	if (gap > 0) {
		for (let i = 0; i < status.length; i++) {
			if (status[i].period > freight.period + product.cycle + GAP) {
				period = Math.floor(status[i].before / sales.minAvgSales);
				if (period < minInventory) {
					minInventory = period;
				}
			}
		}
	} else {
		for (let i = 0; i < status.length; i++) {
			period = Math.floor(status[i].before / sales.minAvgSales);
			if (period < minInventory) {
				minInventory = period;
			}
		}
	}
	return minInventory;
}

async function calculateProducingMinInventory(freightType, status, sales, product, producing) {
	let period;
	let minInventory = 100000;
	let days = await getProducingPeriod(product, producing);
	let type = freightType[0];
	let freight = await findFreightByType(type);
	for (let i = 0; i < status.length; i++) {
		if (status[i].period > freight.period + days + GAP) {
			period = Math.floor(status[i].before / sales.minAvgSales);
			if (period < minInventory) {
				minInventory = period;
			}
		}
	}
	return minInventory;
}

async function recalculateInboundQueue(inboundQueue, sales) {
	let states = [];
	let newInboundQueue = helper.deepClone(inboundQueue);
	for (let i = 0; i < newInboundQueue.length; i++) {
		if (newInboundQueue[i].inventory.before < 0) {
			let period = Math.ceil(-newInboundQueue[i].inventory.before / sales.minAvgSales);
			states.push({
				period: newInboundQueue[i].period - period,
				before: 0,
				after: 0,
			});
			let gap = -newInboundQueue[i].inventory.before;
			for (let j = i; j < newInboundQueue.length; j++) {
				newInboundQueue[j].inventory.before += gap;
				newInboundQueue[j].inventory.after += gap;
			}
		}
		states.push({
			period: newInboundQueue[i].period,
			before: newInboundQueue[i].inventory.before,
			after: newInboundQueue[i].inventory.after,
		});
	}
	return states;
}

async function updateRemainingArrivalDays(deliveries) {
	for (let delivery of deliveries) {
		delivery.remainingArrivalDays = helper.convertDateToPeroid(delivery.expectArrivalDate);
		delivery.save();
	}
}

async function convertInboundShippedsDeliveryDueToPeroid(inboundShippeds) {
	let inbounds = [];
	if (inboundShippeds) {
		for (let inbound of inboundShippeds) {
			inbound.period = await convertDeliveryDueToPeroid(inbound);
			inbounds.push({
				period: inbound.period + GAP,
				quantity: inbound.quantity,
			});
		}
	}
	return inbounds;
}
exports.convertInboundShippedsDeliveryDueToPeroid = convertInboundShippedsDeliveryDueToPeroid;
exports.addCurrentInventoryToInbounds = addCurrentInventoryToInbounds;
async function convertInboundsToSortedQueue(inbounds) {
	let sortedInbounds = await sortQueue(inbounds);
	return sortedInbounds;
}

async function addCurrentInventoryToInbounds(totalInventory, inboundShippeds) {
	inboundShippeds.push({
		quantity: totalInventory,
		period: 0,
	});
}

async function addShipmentToInbounds(shipment, inbounds) {
	let newInbounds = [];
	if (inbounds) {
		newInbounds = JSON.parse(JSON.stringify(inbounds));
	}
	newInbounds.push({
		quantity: shipment.quantity,
		period: shipment.period,
	});
	return newInbounds;
}

async function addFreightPlanToInbounds(freightPlan, inbounds, product) {
	let newInbounds = JSON.parse(JSON.stringify(inbounds));
	for (let type in freightPlan) {
		let freight = await findFreightByType(type);
		let shipment = {
			quantity: await totalUnits(freightPlan[type].boxes, product.unitsPerBox),
			period: product.cycle + freight.period + GAP,
		};
		newInbounds = await addShipmentToInbounds(shipment, newInbounds);
	}
	return newInbounds;
}

async function getProducingPeriod(product, producing) {
	let days = 0;
	if (producing.deliveryDue) {
		days = moment(producing.deliveryDue).diff(moment(), "days");
	} else {
		days = product.cycle - moment().diff(moment(producing.created), "days");
		if (days < 0) {
			days = 0;
		}
	}
	return days;
}
async function addProducingFreightPlanToInbounds(freightPlan, inbounds, product, producing) {
	let newInbounds = JSON.parse(JSON.stringify(inbounds));
	let days = await getProducingPeriod(product, producing);
	for (let type in freightPlan) {
		let freight = await findFreightByType(type);
		let shipment = {
			quantity: await totalUnits(freightPlan[type].boxes, product.unitsPerBox),
			period: days + freight.period + GAP,
		};
		newInbounds = await addShipmentToInbounds(shipment, newInbounds);
	}
	return newInbounds;
}

async function updateProduct(product, attrs) {
	for (let key in attrs) {
		product[key] = attrs[key];
	}
}
exports.updateProduct = updateProduct;
async function getStockByProductV2(product) {
	let stock = 0;
	if (Array.isArray(product.yisucangId)) {
		for (let yisucangId of product.yisucangId) {
			let yisucang = await Yisucang.findYisucangById(yisucangId);
			if (yisucang) {
				stock += yisucang.stock;
			}
		}
	} else {
		let yisucang = await Yisucang.findYisucangById(product.yisucangId);
		if (yisucang) {
			stock += yisucang.stock;
		}
	}
	console.log("stock", stock);
	return stock;
}

exports.getStockByProductV2 = getStockByProductV2;

async function prepareStock(product) {
	const yisucangdStock = await getStockByProductV2(product);
	const plwhsStock = await getPlwhsByProduct(product);

	return { yisucangdStock, plwhsStock };
}
exports.prepareStock = prepareStock;

async function findBySales(sales) {
	return await Product.find({ ps: { $gte: sales }, discontinue: false }).populate("pm");
}

async function findByUser(user) {
	if (user.name === "admin") {
		return await Product.find().populate("pm").sort({ ps: -1 });
	} else {
		return await Product.find({ pm: user._id }).populate("pm").sort({ ps: -1 });
	}
}

async function prepareFbaInventoryAndSales(asin, listings) {
	let inventory = 0;
	let sales = 0;
	if (!listings) {
		listings = await getFbaInventoryByASIN(asin);
	}
	logger.debug(JSON.stringify(listings));
	for (let country in listings[asin]) {
		for (let account in listings[asin][country]) {
			for (let listing of listings[asin][country][account]) {
				inventory =
					inventory +
					listing.availableQuantity +
					listing.reservedFCTransfer +
					listing.inboundShipped;
				sales = sales + listing.ps;
			}
		}
	}
	return {
		inventory: inventory,
		sales: sales,
	};
}

async function prepareFbaInventoryAndSalesV2(asin, listings) {
	let inventory = 0;
	let sales = 0;
	if (!listings) {
		listings = await Listing.findLisingsByAsin(asin);
	}
	for (let listing of listings) {
		if (listing.asin === asin) {
			inventory =
				inventory + listing.availableQuantity + listing.reservedFCTransfer + listing.inboundShipped;
			sales = sales + listing.ps;
		}
	}
	return {
		inventory: inventory,
		sales: Math.ceil(sales),
	};
}

async function prepareFbaInventoryAndSalesV3(product, listings) {
	let fbaInventory = 0;
	let sales = 0;

	if (!listings) {
		listings = await Listing.findByProduct(product);
	}

	for (const listing of listings) {
		fbaInventory =
			inventory +
			listing.availableQuantity +
			listing.reservedFCTransfer +
			listing.inboundShipped +
			listing.reservedFCProcessing;

		sales = sales + listing.ps;
	}

	return {
		fbaInventory,
		sales,
	};
}

async function prepareFbaInventoryAndSalesByCountryV2(asin, country, listings) {
	let availableQuantity = 0;
	let reservedFCTransfer = 0;
	let reservedFCProcessing = 0;
	let inboundShipped = 0;
	let sales = 0;
	if (!listings) {
		listings = await Listing.findLisingsByAsin(asin);
	}
	for (let listing of listings) {
		if (listing.asin === asin && listing.country === country) {
			availableQuantity = availableQuantity + listing.availableQuantity;
			reservedFCTransfer = reservedFCTransfer + listing.reservedFCTransfer;
			inboundShipped = inboundShipped + listing.inboundShipped;
			reservedFCProcessing = reservedFCProcessing + listing.reservedFCProcessing;
			sales = sales + listing.ps;
		}
	}
	return {
		availableQuantity,
		reservedFCTransfer,
		inboundShipped,
		sales,
		reservedFCProcessing,
	};
}

async function removeDeliveredInbounds(product) {
	product.inboundShippeds.forEach(async function (inbound) {
		if (moment(new Date()).diff(moment(inbound.deliveryDue), "days") > 10) {
			await Product.update(
				{ "inboundShippeds._id": inbound._id },
				{ $pull: { inboundShippeds: { _id: inbound._id } } },
			);
		}
	});
}

async function getFbaSalesPeriod(fbaInventorySales) {
	return Math.floor(fbaInventorySales.inventory / fbaInventorySales.sales);
}

async function getStockSalesPeriod(fbaInventorySales, stock) {
	return Math.floor(stock / fbaInventorySales.sales);
}

let getInventoryReport = async function (asin) {
	let report = {};
	let product = await getProductByAsin(asin);
	let fbaInventorySales = await prepareFbaInventoryAndSales(asin);
	console.log(fbaInventorySales);
	let fbaSalesPeriod = await getFbaSalesPeriod(fbaInventorySales);
	let stock = product.stock + product.plwhs;
	let stockSalesPeriod = await getStockSalesPeriod(fbaInventorySales, stock);
	await syncFreight(product);

	let inbounds = await convertInboundShippedsDeliveryDueToPeroid(product.inboundShippeds);

	await addCurrentInventoryToInbounds(fbaInventorySales.inventory + stock, inbounds);
	let newInbounds = await convertInboundsToSortedQueue(inbounds);
	let sales = await getSales(fbaInventorySales, product);
	let inboundQueue = await calculateInboundQueue(newInbounds, sales);
	let status = await recalculateInboundQueue(inboundQueue, sales);
	let gap = await calculateOutOfStockPeriod(status);
	report.fbaSalesPeriod = fbaSalesPeriod;
	report.inventory = fbaInventorySales.inventory;
	report.stock = fbaInventorySales.stock;
	report.stockSalesPeriod = stockSalesPeriod;
	report.status = status;
	report.gap = gap;
	return report;
};

async function getSales(fbaInventorySales, product) {
	await updateProduct(product, {
		ps: Math.ceil(fbaInventorySales.sales),
		fbaInventory: fbaInventorySales.inventory,
	});
	let avgSales;
	if (product.avgSales && product.avgSales > 0) {
		avgSales = product.avgSales;
	} else if (product.maxAvgSales > 0) {
		avgSales = Math.ceil(fbaInventorySales.sales * 0.4 + product.maxAvgSales * 0.6);
	} else {
		avgSales = Math.ceil(fbaInventorySales.sales);
	}
	let sales = {
		airExpress: fbaInventorySales.sales * 0.9 + product.maxAvgSales * 0.1,
		airDelivery: fbaInventorySales.sales * 0.8 + product.maxAvgSales * 0.2,
		seaExpress: avgSales,
		sea: avgSales,
		minAvgSales: avgSales,
		maxAvgSales: product.maxAvgSales,
	};
	return sales;
}

async function updateAllSalesAndInventories() {
	let products = await Product.find();
	for (let product of products) {
		const listings = await Listing.findByProduct(product);
		const { fbaInventory, sales } = await prepareFbaInventoryAndSalesV3(product, listings);
		product.set({ fbaInventory, sales });
		await product.save();
	}
}

async function prepareOrderDues(orderDues) {
	let dues = [];
	for (let type in orderDues) {
		dues.push({
			type: type,
			due: orderDues[type],
		});
	}
	return dues;
}

async function getValidProducings(product) {
	let products = await findValidProducings(product.asin);
	return products[0]?.producings;
}

async function getTotalInventory(product) {}

async function updateAll() {
	const products = await Product.find();
	for (let product of products) {
		const productUpdator = ProductUpdator(product);
		await productUpdator.updateAll();
	}
}
async function getPlanV3(productId, producingId) {
	let product = await Product.findById(productId).populate("deliveries").exec();
	const productUpdator = ProductUpdator(product);
	await productUpdator.updateAll();

	await updateRemainingArrivalDays(product.deliveries);
	await addCurrentInventoryToInbounds(totalInventory, inbounds);

	const minTotalSalesPeriod = totalInventory / product.maxAvgSales;
	const maxTotalSalesPeriod = totalInventory / product.ps;

	let orderDues = await getOrderDue(product, totalInventory, sales);
	logger.debug("orderDues", orderDues);
	let quantity = await getQuantity(sales, totalInventory, product);

	let plan = { plans: [] };
	if (producingId) {
		for (let producing of product.producings) {
			if (producing._id.toString() === producingId) {
				logger.debug(producing);
				let producingPlan = await getProducingFreightPlan(producing, product, sales, inbounds);
				producingPlan.deliveryDue = producing.deliveryDue;
				producingPlan.created = producing.created;
				producingPlan.deliveryPeriod = await getProducingPeriod(product, producing);
				producingPlan.orderId = producing.orderId;
				plan.plans.push(producingPlan);
				plan.gap = producingPlan.gap;
				plan.inventoryStatus = producingPlan.inventoryStatus;
				plan.minInventory = producingPlan.minInventory;
				plan.totalAmount = producingPlan.totalAmount;
				plan.inbounds = producingPlan.inbounds;
			}
		}
	} else {
		let producingsPlan = null;
		let validProducings = await getValidProducings(product);
		if (validProducings?.length > 0) {
			producingsPlan = await getProducingsFreightPlan(product, sales, inbounds, validProducings);
		}
		logger.debug("producingsPlan", producingsPlan);
		if (quantity.boxes > 0) {
			await updateProduct(product, { orderQuantity: quantity.quantity });
			if (producingsPlan) {
				plan = await bestPlanV4(quantity, product, sales, producingsPlan.inbounds || []);
				plan.plans = producingsPlan.plans;
			} else {
				plan = await bestPlanV4(quantity, product, sales, inbounds);
			}
		} else {
			console.log("Inventory is enough, do not need to purchase any more");
			await updateProduct(product, { orderQuantity: 0 });
			if (!producingsPlan) {
				return quantity;
			} else {
				plan = producingsPlan;
			}
		}
	}
	await updateProduct(product, {
		purchase: await getProducingsQuantity(product.producings),
		orderDues: await prepareOrderDues(orderDues),
	});
	await save(product);
	logger.debug(plan);

	let volumeWeightCheck = true;
	for (let type in plan) {
		if (plan[type].units && plan[type].units > 0) {
			if (!checkVolumeWeight(product.box, type)) {
				volumeWeightCheck = false;
			}
		}
	}
	let freights = await Freight.freightTypes();
	let purchase = {
		plan: plan,
		sales: sales,
		quantity: quantity,
		minTotalSalesPeriod: Math.ceil(minTotalSalesPeriod),
		maxTotalSalesPeriod: Math.ceil(maxTotalSalesPeriod),
		totalInventory: totalInventory,
		fbaInventory: fbaInventorySales.inventory,
		stock: stock,
		freights: freights,
		inboundShippeds: inboundShippeds,
		volumeWeightCheck: volumeWeightCheck,
		orderDues: orderDues,
		product: product,
	};
	console.log(purchase);
	return purchase;
}

async function convertProducingQtyIntoBox(producing, product) {
	if (product.unitsPerBox === 0) {
		product.unitsPerBox = 30;
	}
	let quantity = {
		boxes: Math.ceil(producing.quantity / product.unitsPerBox),
	};
	return quantity;
}

async function bestProducingsFreightPlanForAllDelivery(
	producing,
	product,
	sales,
	freightType,
	inbounds,
) {
	let quantity = await convertProducingQtyIntoBox(producing, product);
	let freight = await findFreightByType("airExpress");

	let plan = {
		airExpress: {
			boxes: quantity.boxes,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: quantity.boxes * freight.price * product.box.weight,
	};
	for (let i = 1; i < freightType.length; i++) {
		plan[freightType[i]] = { boxes: 0 };
	}

	let freightPlan = {};
	let result = {
		plan: plan,
		status: "pending",
	};

	let step = Math.ceil(quantity.boxes ** freightType.length / 60000000);
	await getFreightPlanByProducing(
		freightPlan,
		quantity.boxes,
		0,
		freightType,
		inbounds,
		product,
		sales,
		result,
		producing,
		step,
	);
	return await formatPlan(result.plan, product.unitsPerBox);
}

async function getProducingFreightPlan(producing, product, sales, inbounds) {
	let freightType = ["airExpress", "seaExpress"];
	if (product.airDelivery) {
		freightType = ["airExpress", "airDelivery", "seaExpress"];
	}
	if (product.sea) {
		freightType.push("sea");
	}
	return await bestProducingsFreightPlanForAllDelivery(
		producing,
		product,
		sales,
		freightType,
		inbounds,
	);
}

async function prepareProducings(product, validProducings) {
	let producings = JSON.parse(JSON.stringify(validProducings));
	for (let producing of producings) {
		producing.period = await getProducingPeriod(product, producing);
	}
	return await sortQueue(producings);
}

async function getProducingsFreightPlan(product, sales, inbounds, validProducings) {
	let plan = { plans: [] };
	let producings = await prepareProducings(product, validProducings);
	for (let i = 0; i < producings.length; i++) {
		let producingPlan = null;
		if (!producings[i].deletedAt) {
			if (plan.inbounds) {
				producingPlan = await getProducingFreightPlan(producings[i], product, sales, plan.inbounds);
			} else {
				producingPlan = await getProducingFreightPlan(producings[i], product, sales, inbounds);
			}
			producingPlan.deliveryDue = producings[i].deliveryDue;
			producingPlan.created = producings[i].created;
			producingPlan.deliveryPeriod = await getProducingPeriod(product, producings[i]);
			producingPlan.orderId = producings[i].orderId;
			plan.plans.push(producingPlan);
			plan.gap = producingPlan.gap;
			plan.inventoryStatus = producingPlan.inventoryStatus;
			plan.minInventory = producingPlan.minInventory;
			plan.totalAmount = producingPlan.totalAmount;
			plan.inbounds = producingPlan.inbounds;
		}
	}
	return plan;
}

async function findFreightByType(type) {
	let freights = await Freight.freightTypes();
	return freights.find((freight) => freight.type === type);
}
async function getOrderDue() {
	if (product.inTransitShipments) {
		for (let inbound of product.inboundShippeds) {
			let total = totalInventory;
			for (let fasterInbound of product.inboundShippeds) {
				if (moment(fasterInbound.deliveryDue).isBefore(inbound.deliveryDue)) {
					total += inbound.quantity;
				}
			}
			let delivery = moment(inbound.deliveryDue);
			if (total > sales.minAvgSales * (delivery.diff(moment(), "days") + 1)) {
				quantity += Number(inbound.quantity);
			}
		}
	}

	let purchase = await getProducingsQuantity(product.producings);
	quantity += purchase;

	await updateProduct(product, { purchase: purchase });

	let orderDues = {};
	for (let type of freightType) {
		let freight = await findFreightByType(type);
		orderDues[type] = moment().add(
			quantity / sales.minAvgSales - product.cycle - freight.period - GAP - product.minInventory,
			"days",
		);
	}
	return orderDues;
}

async function getQuantity(sales, totalInventory, product) {
	let total = totalInventory;
	if (product.inboundShippeds) {
		for (let inboundShipped of product.inboundShippeds) {
			let delivery = moment(inboundShipped.deliveryDue);
			if (delivery.diff(moment(), "days") + 1 <= 90) {
				total += Number(inboundShipped.quantity);
			}
		}
	}
	if (product.producings) {
		for (let producing of product.producings) {
			total += Number(producing.quantity);
		}
	}

	if (product.unitsPerBox === 0) {
		product.unitsPerBox = 30;
	}
	let boxes = Math.ceil((sales.minAvgSales * 90 - total) / product.unitsPerBox);

	if (boxes > 0) {
		let quantity = boxes * product.unitsPerBox;
		return { boxes: boxes, quantity: quantity };
	} else {
		let days = total / sales.maxAvgSales;
		return { boxes: boxes, days: days };
	}
}
async function totalUnits(boxCount, unitsPerBox) {
	return boxCount * unitsPerBox;
}
async function calculatePlanAmounts(freightPlan, product) {
	let amount = 0;

	for (let type in freightPlan) {
		let freight = await findFreightByType(type);
		freightPlan[type].amount = Math.ceil(
			freightPlan[type].boxes * freight.price * product.box.weight,
		);
		freightPlan[type].weight = Math.ceil(freightPlan[type].boxes * product.box.weight);
		amount += freightPlan[type].amount;
	}
	freightPlan.totalAmount = amount;
	return freightPlan;
}

async function checkVolumeWeight(box, freightType) {
	let volumeWeight = undefined;
	if (freightType.indexOf("sea") > 0) {
		volumeWeight = (box.length + box.width + box.height) / 5000;
	} else {
		volumeWeight = (box.length + box.width + box.height) / 6000;
	}
	return volumeWeight < 1.2 * box.wt;
}

async function formatPlan(plan, unitsPerBox) {
	for (let type in plan) {
		if (plan[type].boxes) {
			plan[type].units = plan[type].boxes * unitsPerBox;
		}
	}
	return plan;
}

async function calculatePlan(freightPlan, freightType, inbounds, product, sales, result) {
	let newPlan = await getNewFreightPlan(freightPlan, freightType, inbounds, product, sales);
	// 更新策略
	// 1. 存在断货:
	//   1.1 最小库存不满足要求
	//     1.1.1新计划断货时间更短
	//     1.1.2新计划断货时间相同，但是最小库存更多
	//   1.2 最小库存满足要求
	//     1.2.1新计划断货时间更短
	// 2. 不存在断货
	//   2.1 最小库存不满足要求
	//     2.1.1 新计划不断货，而且最小库存更多
	//   2.2 最小库存满足要求 (找到发货方案)
	if (newPlan.minInventory >= product.minInventory && newPlan.gap == 0) {
		// 最低库存已满足要求，并且没有断货，当前运输计划费用最低
		result.plan = JSON.parse(JSON.stringify(newPlan));
		result.status = "done";
		return;
	} else {
		if (result.plan.gap > 0) {
			// 已有的发货计划存在断货
			if (newPlan.gap < result.plan.gap) {
				result.plan = JSON.parse(JSON.stringify(newPlan));
			} else if (newPlan.gap === result.plan.gap) {
				if (result.plan.minInventory < product.minInventory) {
					if (newPlan.minInventory > result.plan.minInventory) {
						result.plan = JSON.parse(JSON.stringify(newPlan));
					}
				}
			}
		} else {
			if (newPlan.gap === 0) {
				if (result.plan.minInventory < product.minInventory) {
					if (newPlan.minInventory > result.plan.minInventory) {
						result.plan = JSON.parse(JSON.stringify(newPlan));
					}
				}
			}
		}
	}

	return result;
}

async function calculateProducingPlan(
	freightPlan,
	freightType,
	inbounds,
	product,
	sales,
	result,
	producing,
) {
	let newPlan = await getNewProducingFreightPlan(
		freightPlan,
		freightType,
		product,
		sales,
		producing,
		inbounds,
	);

	if (newPlan.minInventory >= product.minInventory && newPlan.gap == 0) {
		result.plan = JSON.parse(JSON.stringify(newPlan));
		result.status = "done";
		return;
	} else {
		if (result.plan.gap > 0) {
			if (newPlan.gap < result.plan.gap) {
				result.plan = JSON.parse(JSON.stringify(newPlan));
			} else if (newPlan.gap === result.plan.gap) {
				if (result.plan.minInventory < product.minInventory) {
					if (newPlan.minInventory > result.plan.minInventory) {
						result.plan = JSON.parse(JSON.stringify(newPlan));
					}
				}
			}
		}
	}
	logger.debug("result", result);
	logger.debug("newPlan", newPlan);
	return result;
}

async function getFreightPlan(
	freightPlan,
	left,
	index,
	freightType,
	inbounds,
	product,
	sales,
	result,
	step,
) {
	if (left < 0) {
		return;
	}
	if (result.status === "done") {
		return null;
	}
	if (index === freightType.length - 1) {
		freightPlan[freightType[index]] = { boxes: left };
		let freightPlanDup = JSON.parse(JSON.stringify(freightPlan));
		await calculatePlan(freightPlanDup, freightType, inbounds, product, sales, result);
		if (result.status === "done") {
			return null;
		}
	} else {
		let i = 0;
		while (i <= left) {
			freightPlan[freightType[index]] = { boxes: i };
			await getFreightPlan(
				freightPlan,
				left - i,
				index + 1,
				freightType,
				inbounds,
				product,
				sales,
				result,
				step,
			);
			if (i + step <= left) {
				i += step;
			} else {
				let stepDup = step;
				while (i + stepDup > left && stepDup >= 2) {
					stepDup = Math.round(stepDup / 2);
				}
				i += stepDup;
			}
		}
	}
}

async function getFreightPlanByProducing(
	freightPlan,
	left,
	index,
	freightType,
	inbounds,
	product,
	sales,
	result,
	producing,
	step,
) {
	if (result.status === "done") {
		return null;
	}
	if (index === freightType.length - 1) {
		freightPlan[freightType[index]] = { boxes: left };
		let freightPlanDup = JSON.parse(JSON.stringify(freightPlan));
		await calculateProducingPlan(
			freightPlanDup,
			freightType,
			inbounds,
			product,
			sales,
			result,
			producing,
		);
		if (result.status === "done") {
			return null;
		}
	} else {
		let i = 0;
		while (i <= left) {
			freightPlan[freightType[index]] = { boxes: i };
			await getFreightPlanByProducing(
				freightPlan,
				left - i,
				index + 1,
				freightType,
				inbounds,
				product,
				sales,
				result,
				producing,
				step,
			);
			if (i + step <= left) {
				i += step;
			} else {
				let stepDup = step;
				while (i + stepDup > left && stepDup >= 2) {
					stepDup = Math.round(stepDup / 2);
				}
				i += stepDup;
			}
		}
	}
}
async function bestPlanForAllDelivery(quantity, product, sales, inbounds, freightType) {
	let freight = await findFreightByType("airExpress");
	let plan = {
		airExpress: {
			boxes: quantity.boxes,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: quantity.boxes * freight.price * product.box.weight,
	};
	for (let i = 1; i < freightType.length; i++) {
		plan[freightType[i]] = { boxes: 0 };
	}

	let freightPlan = {};
	let result = {
		plan: plan,
		status: "pending",
	};
	let step = Math.ceil(quantity.boxes ** freightType.length / 60000000);
	await getFreightPlan(
		freightPlan,
		quantity.boxes,
		0,
		freightType,
		inbounds,
		product,
		sales,
		result,
		step,
	);

	return await formatPlan(result.plan, product.unitsPerBox);
}

async function getNewFreightPlan(freightPlan, freightType, inbounds, product, sales) {
	let newInbounds = await addFreightPlanToInbounds(freightPlan, inbounds, product);
	newInbounds = await convertInboundsToSortedQueue(newInbounds);
	let inboundQueue = await calculateInboundQueue(newInbounds, sales);
	let status = await recalculateInboundQueue(inboundQueue, sales);
	let newPlan = await calculatePlanAmounts(freightPlan, product);
	newPlan.gap = await calculateOutOfStockPeriod(status);
	newPlan.minInventory = await calculateMinInventory(
		freightType,
		status,
		sales,
		product,
		newPlan.gap,
	);
	newPlan.inventoryStatus = status;
	return newPlan;
}

async function getNewProducingFreightPlan(
	freightPlan,
	freightType,
	product,
	sales,
	producing,
	inbounds,
) {
	let newInbounds = await addProducingFreightPlanToInbounds(
		freightPlan,
		inbounds,
		product,
		producing,
	);
	newInbounds = await convertInboundsToSortedQueue(newInbounds);
	let inboundQueue = await calculateInboundQueue(newInbounds, sales);
	let status = await recalculateInboundQueue(inboundQueue, sales);
	let newPlan = await calculatePlanAmounts(freightPlan, product);
	newPlan.gap = await calculateOutOfStockPeriod(status);
	newPlan.minInventory = await calculateProducingMinInventory(
		freightType,
		status,
		sales,
		product,
		producing,
	);
	newPlan.inventoryStatus = status;
	newPlan.inbounds = newInbounds;
	return newPlan;
}

async function bestPlanV4(quantity, product, sales, inbounds) {
	let freightType = ["airExpress", "seaExpress"];
	if (product.airDelivery) {
		freightType = ["airExpress", "airDelivery", "seaExpress"];
	}

	if (product.sea) {
		freightType.push("sea");
	}

	return await bestPlanForAllDelivery(quantity, product, sales, inbounds, freightType);
}

async function findValidProducings(asin) {
	return Product.aggregate([
		{ $match: { asin: asin } },
		{
			$project: {
				producings: {
					$filter: {
						input: "$producings",
						as: "producing",
						cond: {
							$eq: ["$$producing.deleted", false],
						},
					},
				},
			},
		},
	]);
}

const getProductByPlwhsId = async function (plwhsId) {
	return Product.findOne({ plwhsId })
		.clone()
		.catch(function (err) {
			console.log(err);
		});
};

async function getProductByAsin(asin) {
	return Product.findOne({ asin: asin })
		.clone()
		.catch(function (err) {
			console.log(err);
		});
}

async function createOrUpdate(product) {
	let existProduct = await Product.findById(product.productId);

	if (existProduct) {
		Object.assign(existProduct, product);
		await existProduct.save();
	} else {
		const newProduct = new Product(product);
		await newProduct.save();
	}
}

async function newAndSave(data) {
	let product = new Product(data);
	return await product.save();
}

async function createNewProduct(data, callback) {
	let product = new Product();
	product.asin = data.asin;
	product.save(callback);
}

let deleteInbound = async function (inboundId) {
	let objId = mongoose.Types.ObjectId(inboundId);
	await Product.update(
		{ "inboundShippeds._id": objId },
		{ $pull: { inboundShippeds: { _id: objId } } },
	);
};
let deleteProducing = async function (producingId) {
	let objId = mongoose.Types.ObjectId(producingId);
	await Product.updateOne(
		{ "producings._id": objId },
		{ $set: { "producings.$.deletedAt": Date.now(), "producings.$.deleted": true } },
	);
};

let updateInbound = async function (inboundId, deliveryDue, quantity) {
	let objId = mongoose.Types.ObjectId(inboundId);
	await Product.updateOne(
		{ "inboundShippeds._id": objId },
		{
			$set: {
				"inboundShippeds.$.deliveryDue": deliveryDue,
				"inboundShippeds.$.quantity": quantity,
			},
		},
	);
};

async function updateProductProducingStatus() {
	let products = await Product.find();
	for (let product of products) {
		console.log(product.asin);
		if (product.producings) {
			for (let producing of product.producings) {
				producing.deleted = false;
			}
		}
		await save(product);
	}
}

async function updateProducing(producingId, deliveryDue, quantity) {
	let objId = mongoose.Types.ObjectId(producingId);
	await Product.updateOne(
		{ "producings._id": objId },
		{ $set: { "producings.$.deliveryDue": deliveryDue, "producings.$.quantity": quantity } },
	);
}

async function remove(productId) {
	await Product.deleteOne({ _id: mongoose.Types.ObjectId(productId) });
}

module.exports = {
	findById: Product.findById.bind(Product),
	find: Product.find.bind(Product),
	updateProducing,
	deleteProducing,
	updateInbound,
	deleteInbound,
	remove,
	prepareFbaInventoryAndSales,
	prepareFbaInventoryAndSalesV2,
	prepareFbaInventoryAndSalesV3,
	updateProductProducingStatus,
	newAndSave,
	createOrUpdate,
	createNewProduct,
	getProductByAsin,
	getProductByPlwhsId,
	getOrderDue,
	getQuantity,
	findFreightByType,
	getProducingFreightPlan,
	prepareOrderDues,
	getPlanV3,
	getSales,
	removeDeliveredInbounds,
	prepareFbaInventoryAndSalesByCountryV2,
	prepareFbaInventoryAndSalesV3,
	findByUser,
	updateAll,
};
