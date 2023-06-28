const models = require("../models");
const Product = models.Product;
const User = require("./user");
const mongoose = require("mongoose");
const getPm = require("../api/getPM");
const helper = require("../lib/util/helper");
let moment = require("moment");
const GAP = 6;
let Shipment = require("./shipment");
const ProductUpdator = require("./product_updator");
let Listing = require("./listing");
let Yisucang = require("./yisucang");
let logger = require("../common/logger");
const mysql = require("mysql2");
const { Delivery } = require(".");

const ShipmentTypesInfo = {
	airExpress: {
		price: 55,
		period: 8,
	},
	airDelivery: {
		price: 55,
		period: 8,
	},
	seaExpress: {
		price: 55,
		period: 8,
	},
	sea: {
		price: 55,
		period: 8,
	},
};

async function getInboundShippedCount(asin) {
	let shipped = 0;
	let listings = await Listing.findLisingsByAsin(asin);
	for (let listing of listings) {
		shipped += listing.inboundShipped;
	}
	return shipped;
}

exports.getInboundShippedCount = getInboundShippedCount;

async function getShipment(product) {
	Shipment.getShipmentsAndProductingsByProduct(product);
}

async function checkpurchases(product, shipmentsAndpurchases) {
	for (let j = 0; j < shipmentsAndpurchases.purchases.length; j++) {
		for (let i = 0; i < product.purchases.length; i++) {
			if (product.purchases[i].orderId === shipmentsAndpurchases.purchases[j].orderId) {
				shipmentsAndpurchases.purchases[j].deliveryDue = product.purchases[i].deliveryDue;
				shipmentsAndpurchases.purchases[j].deletedAt = product.purchases[i].deletedAt;
			}
		}
	}
}

async function getpurchasesQuantity(purchases) {
	let quantity = 0;
	if (purchases) {
		for (let i = 0; i < purchases.length; i++) {
			quantity += purchases[i].quantity;
		}
	}
	return quantity;
}

async function syncShipment(product, days) {
	// let shipmentsAndpurchases = await Shipment.getShipmentsAndProductingsByProduct(product, days);
	let shipmentsAndpurchases = await Shipment.getShipmentsAndProductingsByProductV2(product, days);
	await checkpurchases(product, shipmentsAndpurchases);
	product.inboundShippeds = shipmentsAndpurchases.inboundShippeds;
	product.purchases = shipmentsAndpurchases.purchases;
	product.purchase = await getpurchasesQuantity(product.purchases);
}

async function syncAllProductShipments(days) {
	let products = await Product.find();
	const types = await Shipment.shipmentTypes();
	const allShipments = await Shipment.syncShipments();
	const yisucangInbounds = await Shipment.getYisucangInbounds();
	let inbounds = await Shipment.remvoeDuplicateYisucangInbounds(yisucangInbounds);
	const yisucangReciveds = await Shipment.getYisucangReciveds();
	let recieveds = await Shipment.remvoeDuplicateYisucangInbounds(yisucangReciveds);
	for (let product of products) {
		let shipmentsAndpurchases = await Shipment.getShipmentsAndProductingsByProductV2(
			product,
			days,
			types,
			allShipments,
			inbounds,
			recieveds,
		);
		await checkpurchases(product, shipmentsAndpurchases);
		product.inboundShippeds = shipmentsAndpurchases.inboundShippeds;
		product.purchases = shipmentsAndpurchases.purchases;
		product.purchase = await getpurchasesQuantity(product.purchases);
		await save(product);
	}
}
exports.syncAllProductShipments = syncAllProductShipments;
exports.syncShipment = syncShipment;
exports.getShipment = getShipment;

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

async function getInventoryStatusQueue(inbounds, sales) {
	let inboundQueue = await getPlainInventoryStatusQueue(inbounds, sales);
	let status = await recalculateInboundQueue(inboundQueue, sales);
	return status;
}
async function getPlainInventoryStatusQueue(inbounds, sales) {
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

async function calculateMinInventory(shipmentTypes, status, sales, product, gap) {
	let period = 0;
	let minInventory = 100000;
	let shipmentType = ShipmentTypesInfo[shipmentTypes[0]];
	// 如果存在断货，检查第一批到货之后的最小库存
	// 如果不存在断货，检查所有时刻最小库存
	if (gap > 0) {
		for (let i = 0; i < status.length; i++) {
			if (status[i].period > shipmentType.period + product.cycle + GAP) {
				period = Math.floor(status[i].before / sales);
				if (period < minInventory) {
					minInventory = period;
				}
			}
		}
	} else {
		for (let i = 0; i < status.length; i++) {
			period = Math.floor(status[i].before / sales);
			if (period < minInventory) {
				minInventory = period;
			}
		}
	}
	return minInventory;
}

async function calculatePurchaseMinInventory(shipmentTypes, status, sales, purchase) {
	let period;
	let minInventory = 100000;
	let days = await getPurchasePeriod(product, purchase);
	let type = shipmentTypes[0];
	let shipmentType = ShipmentTypesInfo[type];
	for (let i = 0; i < status.length; i++) {
		if (status[i].period > shipmentType.period + days + GAP) {
			period = Math.floor(status[i].before / sales);
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

function addCurrentInventoryToInbounds(totalInventory, inbounds) {
	inbounds.push({
		quantity: totalInventory,
		period: 0,
	});
}

async function addShipmentPlanToInbounds(shipmentPlan, inbounds, product) {
	let newInbounds = JSON.parse(JSON.stringify(inbounds));
	for (let type in shipmentPlan) {
		let shipment = await findShipmentByType(type);
		let shipment = {
			quantity: await totalUnits(shipmentPlan[type].boxes, product.unitsPerBox),
			period: product.cycle + shipment.period + GAP,
		};
		newInbounds = await addShipmentToInbounds(shipment, newInbounds);
	}
	return newInbounds;
}

async function addPurchaseShipmentPlanToInbounds(shipmentPlan, inbounds, product, purchase) {
	let newInbounds = helper.deepClone(inbounds);
	for (let type in shipmentPlan) {
		let shipmentType = ShipmentTypesInfo[type];
		let shipment = {
			quantity: shipmentPlan[type].boxes * product.unitsPerBox,
			period: purchase.expectDeliveryDays + shipmentType.period + GAP,
		};

		newInbounds.push({
			quantity: shipment.quantity,
			period: shipment.period,
		});
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

async function getFbaSalesPeriod(fbaInventorySales) {
	return Math.floor(fbaInventorySales.inventory / fbaInventorySales.sales);
}

async function getStockSalesPeriod(fbaInventorySales, stock) {
	return Math.floor(stock / fbaInventorySales.sales);
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

async function getValidpurchases(product) {
	let products = await findValidpurchases(product.asin);
	return products[0]?.purchases;
}

async function getTotalInventory(product) {}

async function updateAll() {
	const products = await Product.find();
	for (let product of products) {
		const productUpdator = ProductUpdator(product);
		await productUpdator.updateAll();
	}
}

async function getPlanV3(productId, purchaseCode) {
	let product = await Product.findById(productId).populate("deliveries").exec();
	const productUpdator = ProductUpdator(product);
	await productUpdator.updateAll();

	const { totalInventory, shipments, maxAvgSales, ps } = product;

	let inbounds = helper.deepClone(shipments);

	addCurrentInventoryToInbounds(totalInventory, inbounds);

	const minTotalSalesPeriod = totalInventory / maxAvgSales;
	const maxTotalSalesPeriod = totalInventory / ps;

	let orderDues = await getOrderDue(product);
	logger.debug("orderDues", orderDues);

	let plan = { plans: [] };
	if (purchaseCode) {
		for (let purchase of product.purchases) {
			if (purchase.code === purchaseCode) {
				let purchasePlan = await getPurchaseShimpentPlan(purchase, product, inbounds);
				purchasePlan.deliveryDue = purchase.deliveryDue;
				purchasePlan.created = purchase.created;
				purchasePlan.deliveryPeriod = await getpurchasePeriod(product, purchase);
				purchasePlan.orderId = purchase.orderId;
				plan.plans.push(purchasePlan);
				plan.gap = purchasePlan.gap;
				plan.inventoryStatus = purchasePlan.inventoryStatus;
				plan.minInventory = purchasePlan.minInventory;
				plan.totalAmount = purchasePlan.totalAmount;
				plan.inbounds = purchasePlan.inbounds;
			}
		}
	} else {
		let purchasesPlan = null;
		pruchases = helper.deepClone(product.purchases);
		purchasesPlan = await getPurchasesShipmentPlan(product, inbounds, pruchases);
		logger.debug("purchasesPlan", purchasesPlan);
		if (quantity.boxes > 0) {
			await updateProduct(product, { orderQuantity: quantity.quantity });
			if (purchasesPlan) {
				plan = await bestPlanV4(quantity, product, purchasesPlan.inbounds || []);
				plan.plans = purchasesPlan.plans;
			} else {
				plan = await bestPlanV4(quantity, product, inbounds);
			}
		} else {
			console.log("Inventory is enough, do not need to purchase any more");
			await updateProduct(product, { orderQuantity: 0 });
			if (!purchasesPlan) {
				return quantity;
			} else {
				plan = purchasesPlan;
			}
		}
	}
	await updateProduct(product, {
		purchase: await getpurchasesQuantity(product.purchases),
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
	let shipments = await Shipment.shipmentTypes();
	let purchase = {
		plan: plan,
		sales: sales,
		quantity: quantity,
		minTotalSalesPeriod: Math.ceil(minTotalSalesPeriod),
		maxTotalSalesPeriod: Math.ceil(maxTotalSalesPeriod),
		totalInventory: totalInventory,
		fbaInventory: fbaInventorySales.inventory,
		stock: stock,
		shipments: shipments,
		inboundShippeds: inboundShippeds,
		volumeWeightCheck: volumeWeightCheck,
		orderDues: orderDues,
		product: product,
	};
	console.log(purchase);
	return purchase;
}

async function convertpurchaseQtyIntoBox(purchase, product) {
	return {
		quantity: quantity,
		boxes: Math.ceil(purchase.quantity / product.unitsPerBox),
	};
}

async function initShipmentPlan(purchase, product, inbounds) {
	let quantity = await convertPurchaseQtyIntoBox(purchase, product);

	const shipmentTypes = helper.deepClone(product.shipmentTypes);

	let plan = {
		[shipmentTypes[0]]: {
			boxes: quantity.boxes,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: quantity.boxes * ShipmentTypesInfo[shipmentTypes[0]].price * product.box.weight,
	};
	for (let i = 1; i < shipmentTypes.length; i++) {
		plan[shipmentTypes[i]] = { boxes: 0 };
	}

	let shipmentPlan = {};
	let result = {
		plan: plan,
		status: "pending",
	};

	let step = Math.ceil(quantity.boxes ** shipmentType.length / 60000000);
}
async function getPurchaseShimpentPlan(purchase, product, inbounds) {
	let quantity = await convertPurchaseQtyIntoBox(purchase, product);

	const shipmentTypes = helper.deepClone(product.shipmentTypes);

	let plan = {
		[shipmentTypes[0]]: {
			boxes: quantity.boxes,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: quantity.boxes * ShipmentTypesInfo[shipmentTypes[0]].price * product.box.weight,
		deliveryDue: purchase.deliveryDue,
		created: purchase.created,
		deliveryPeriod: purchase.expectDeliveryDays,
		orderId: purchase.orderId,
	};
	for (let i = 1; i < shipmentTypes.length; i++) {
		plan[shipmentTypes[i]] = { boxes: 0 };
	}

	let shipmentPlan = {};

	let result = {
		plan: plan,
		status: "pending",
	};

	let step = Math.ceil(quantity.boxes ** shipmentTypes.length / 60000000);
	await getShipmentPlanByPurchase(
		shipmentPlan,
		quantity.boxes, // the boxes that other shipment types need to ship
		0, // the index of shipment type
		shipmentTypes,
		inbounds,
		product,
		result,
		purchase,
		step,
	);
	return await formatPlan(result.plan, product.unitsPerBox);
}

async function getPurchasesShipmentPlan(product, inbounds, purchases) {
	let plan = { plans: [], inbounds };
	for (let i = 0; i < purchases.length; i++) {
		const shipmentPlan = await getPurchaseShimpentPlan(purchases[i], product, plan.inbounds);
		shipmentPlan.deliveryDue = purchases[i].deliveryDue;
		shipmentPlan.created = purchases[i].created;
		shipmentPlan.deliveryPeriod = await getpurchasePeriod(product, purchases[i]);
		shipmentPlan.orderId = purchases[i].orderId;
		plan.plans.push(shipmentPlan);
		plan.gap = shipmentPlan.gap;
		plan.inventoryStatus = shipmentPlan.inventoryStatus;
		plan.minInventory = shipmentPlan.minInventory;
		plan.totalAmount = shipmentPlan.totalAmount;
		plan.inbounds = shipmentPlan.inbounds;
	}
	return plan;
}

async function findShipmentByType(type) {
	let shipments = await Shipment.shipmentTypes();
	return shipments.find((shipment) => shipment.type === type);
}
async function getOrderDue(product) {
	let orderDues = {};
	for (let type of product.shipmentTypes) {
		let shipment = await findShipmentByType(type);
		orderDues[type] = moment().add(
			quantity / product.ps - product.cycle - shipment.period - GAP - product.minInventory,
			"days",
		);
	}
	return orderDues;
}

async function calculatePlanAmounts(shipmentPlan, product) {
	let amount = 0;

	for (let type in shipmentPlan) {
		let shipmentType = ShipmentTypesInfo[type];
		shipmentPlan[type].amount = Math.ceil(
			shipmentPlan[type].boxes * shipmentType.price * product.box.weight,
		);
		shipmentPlan[type].weight = Math.ceil(shipmentPlan[type].boxes * product.box.weight);
		amount += shipmentPlan[type].amount;
	}
	shipmentPlan.totalAmount = amount;
	return shipmentPlan;
}

async function checkVolumeWeight(box, shipmentType) {
	let volumeWeight = undefined;
	if (shipmentType.indexOf("sea") > 0) {
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

async function calculatePlan(shipmentPlan, shipmentType, inbounds, product, result) {
	let newPlan = await getNewShipmentPlan(shipmentPlan, shipmentType, inbounds, product);
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
		result.plan = helper.deepClone(newPlan);
		result.status = "done";
		return;
	} else {
		if (result.plan.gap > 0) {
			// 已有的发货计划存在断货
			if (newPlan.gap < result.plan.gap) {
				result.plan = helper.deepClone(newPlan);
			} else if (newPlan.gap === result.plan.gap) {
				if (result.plan.minInventory < product.minInventory) {
					if (newPlan.minInventory > result.plan.minInventory) {
						result.plan = helper.deepClone(newPlan);
					}
				}
			}
		} else {
			if (newPlan.gap === 0) {
				if (result.plan.minInventory < product.minInventory) {
					if (newPlan.minInventory > result.plan.minInventory) {
						result.plan = helper.deepClone(newPlan);
					}
				}
			}
		}
	}

	return result;
}

async function calculatePurchasePlan(
	shipmentPlan,
	shipmentTypes,
	inbounds,
	product,
	result,
	purchase,
) {
	let newPlan = await getNewpurchaseshipmentPlan(
		shipmentPlan,
		shipmentTypes,
		product,
		purchase,
		inbounds,
	);

	if (newPlan.minInventory >= product.minInventory && newPlan.gap == 0) {
		result.plan = helper.deepClone(newPlan);
		result.status = "done";
		return;
	} else {
		if (result.plan.gap > 0) {
			if (newPlan.gap < result.plan.gap) {
				result.plan = helper.deepClone(newPlan);
			} else if (newPlan.gap === result.plan.gap) {
				if (result.plan.minInventory < product.minInventory) {
					if (newPlan.minInventory > result.plan.minInventory) {
						result.plan = helper.deepClone(newPlan);
					}
				}
			}
		}
	}
	return result;
}

async function getShipmentPlan(
	shipmentPlan,
	left,
	index,
	shipmentType,
	inbounds,
	product,
	result,
	step,
) {
	if (left < 0) {
		return;
	}
	if (result.status === "done") {
		return null;
	}
	if (index === shipmentType.length - 1) {
		shipmentPlan[shipmentType[index]] = { boxes: left };
		let shipmentPlanDup = helper.deepClone(shipmentPlan);
		await calculatePlan(shipmentPlanDup, shipmentType, inbounds, product, sales, result);
		if (result.status === "done") {
			return null;
		}
	} else {
		let i = 0;
		while (i <= left) {
			shipmentPlan[shipmentType[index]] = { boxes: i };
			await getShipmentPlan(
				shipmentPlan,
				left - i,
				index + 1,
				shipmentType,
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

async function getShipmentPlanByPurchase(
	shipmentPlan,
	left,
	index,
	shipmentTypes,
	inbounds,
	product,
	result,
	purchase,
	step,
) {
	if (result.status === "done") {
		return null;
	}
	if (index === shipmentTypes.length - 1) {
		shipmentPlan[shipmentTypes[index]] = { boxes: left };
		let shipmentPlanDup = helper.deepClone(shipmentPlan);

		await calculatePurchasePlan(
			shipmentPlanDup,
			shipmentTypes,
			inbounds,
			product,
			result,
			purchase,
		);

		if (result.status === "done") {
			return null;
		}
	} else {
		let i = 0;
		while (i <= left) {
			shipmentPlan[shipmentType[index]] = { boxes: i };
			await getShipmentPlanByPurchase(
				shipmentPlan,
				left - i,
				index + 1,
				shipmentTypes,
				inbounds,
				product,
				result,
				purchase,
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

async function bestPlanV4(quantity, product, inbounds) {
	if (product.shipmentTypes.length === 0) {
		return;
	}
	const firstShipmentType = product.shipmentTypes[0];

	const shipmentType = ShipmentTypesInfo[firstShipmentType];
	let plan = {
		[firstShipmentType]: {
			boxes: quantity.boxes,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: quantity.boxes * shipmentType.price * product.box.weight,
	};
	for (let i = 1; i < shipmentType.length; i++) {
		plan[shipmentType[i]] = { boxes: 0 };
	}

	let shipmentPlan = {};
	let result = {
		plan: plan,
		status: "pending",
	};
	let step = Math.ceil(quantity.boxes ** shipmentType.length / 60000000);
	await getShipmentPlan(
		shipmentPlan,
		quantity.boxes,
		0,
		shipmentType,
		inbounds,
		product,
		result,
		step,
	);

	return await formatPlan(result.plan, product.unitsPerBox);
}

async function getNewPlan(shipmentPlan, product, status) {
	let newPlan = await calculatePlanAmounts(shipmentPlan, product);
	newPlan.gap = await calculateOutOfStockPeriod(status);
	newPlan.minInventory = await calculatepurchaseMinInventory(
		shipmentType,
		status,
		product,
		newPlan.gap,
	);
	newPlan.inventoryStatus = status;
	return newPlan;
}

async function getNewPurchaseShipmentPlan(
	freightPlan,
	freightType,
	product,
	sales,
	purchase,
	inbounds,
) {
	let newInbounds = await addPurchaseShipmentPlanToInbounds(
		freightPlan,
		inbounds,
		product,
		purchase,
	);
	newInbounds = await convertInboundsToSortedQueue(newInbounds);
	let inboundQueue = await calculateInboundQueue(newInbounds, sales);
	let status = await recalculateInboundQueue(inboundQueue, sales);
	let newPlan = await calculatePlanAmounts(freightPlan, product);
	newPlan.gap = await calculateOutOfStockPeriod(status);
	newPlan.minInventory = await calculatePurchaseMinInventory(
		freightType,
		status,
		sales,
		product,
		purchase,
	);
	newPlan.inventoryStatus = status;
	newPlan.inbounds = newInbounds;
}

async function getNewPurchaseShipmentPlan(
	shipmentPlan,
	shipmentTypes,
	product,
	inbounds,
	purchase,
) {
	let newInbounds = null;
	if (purchase) {
		newInbounds = await addPurchaseShipmentPlanToInbounds(
			shipmentPlan,
			inbounds,
			product,
			purchase,
		);
	} else {
		newInbounds = await addShipmentPlanToInbounds(shipmentPlan, inbounds, product);
	}

	let newSortedInbounds = await sortQueue(newInbounds);
	let status = await getInventoryStatusQueue(newSortedInbounds, product.ps);
	let newPlan = await calculatePlanAmounts(shipmentPlan, product);
	newPlan.gap = await calculateOutOfStockPeriod(status);

	if (purchase) {
		newPlan.minInventory = await calculatePurchaseMinInventory(
			shipmentTypes,
			status,
			product.ps,
			purchase,
		);
	} else {
		newPlan.minInventory = await calculateMinInventory(
			shipmentType,
			status,
			product.ps,
			newPlan.gap,
		);
	}

	newPlan.inventoryStatus = status;
	newPlan.inbounds = newInbounds;
	return newPlan;
}

const getProductByPlwhsId = async function (plwhsId) {
	return Product.findOne({ plwhsId })
		.clone()
		.catch(function (err) {
			console.log(err);
		});
};

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

let deleteInbound = async function (inboundId) {
	let objId = mongoose.Types.ObjectId(inboundId);
	await Product.update(
		{ "inboundShippeds._id": objId },
		{ $pull: { inboundShippeds: { _id: objId } } },
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

async function remove(productId) {
	await Product.deleteOne({ _id: mongoose.Types.ObjectId(productId) });
}

module.exports = {
	findById: Product.findById.bind(Product),
	find: Product.find.bind(Product),
	updatepurchase,
	deletepurchase,
	updateInbound,
	deleteInbound,
	remove,
	prepareFbaInventoryAndSalesV3,
	updateProductpurchasestatus,
	newAndSave,
	createOrUpdate,
	createNewProduct,
	getProductByAsin,
	getProductByPlwhsId,
	getOrderDue,
	getQuantity,
	findShipmentByType,
	getPurchaseShimpentPlan,
	prepareOrderDues,
	getPlanV3,
	getSales,
	removeDeliveredInbounds,
	prepareFbaInventoryAndSalesV3,
	findByUser,
	updateAll,
};
