const models = require("../models");
const Product = models.Product;
const ShipmentType = models.ShipmentType;
const User = require("./user");
const mongoose = require("mongoose");
const getPm = require("../api/getPM");
const helper = require("../lib/util/helper");
let moment = require("moment");
const GAP = 6;
const ProductUpdator = require("./product_updator");
let Listing = require("./listing");
let Yisucang = require("./yisucang");
let logger = require("../common/logger");
const mysql = require("mysql2");

let ShipmentTypesInfo;
async function getShipmentTypes() {
	let shipmentTypes = await ShipmentType.find();
	let ShipmentTypesInfo = {};
	for (type of shipmentTypes) {
		ShipmentTypesInfo[type.name] = {
			price: type.price,
			period: type.period,
		};
	}
	return ShipmentTypesInfo;
}

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

async function syncShipment(product, days) {
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
	console.log(products.length);
	for (let product of products) {
		for (let country of product.countries) {
			let user = await getPm(product.asin, country.toUpperCase());
			if (user !== "unknown") {
				console.log("user", user);
				let pm = await User.findOrCreate(user);
				console.log("pm", pm);
				product.pm = pm;
				await product.save();
				User.updateUser(user);
				break;
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
	if (inboundQueue.length === 0) {
		return inboundQueue;
	}
	if ("period" in inboundQueue[0]) {
		return inboundQueue.sort(compare("period"));
	}
	if ("leadDays" in inboundQueue[0]) {
		return inboundQueue.sort(compare("leadDays"));
	}
}

async function getInventoryStatus(inbounds, sales) {
	let inboundQueue = await getPlainInventoryStatusQueue(inbounds, sales);
	let inventoryStatus = await updateInboundQueueOutOfStockInfo(inboundQueue, sales);
	return inventoryStatus;
}
async function getPlainInventoryStatusQueue(inbounds, sales) {
	let inboundQueue = [
		{
			period: inbounds[0].period,
			inventory: {
				before: inbounds[0].quantity,
				after: inbounds[0].quantity,
			},
		},
	];

	for (let i = 1; i < inbounds.length; i++) {
		let recievedProductCount = 0;
		for (let j = 0; j < i; j++) {
			recievedProductCount += inbounds[j].quantity;
		}

		const arrivalInventory = recievedProductCount - inbounds[i].period * sales;

		inboundQueue.push({
			period: inbounds[i].period,
			inventory: {
				before: arrivalInventory,
				after: arrivalInventory + inbounds[i].quantity,
			},
		});
	}
	return inboundQueue;
}

async function calculateOutOfStockPeriod(status) {
	let outOfStockDays = 0;

	for (let i = 0; i < status.length - 1; i++) {
		if (status[i].before === 0 && status[i].after === 0) {
			outOfStockDays += status[i + 1].period - status[i].period + 1;
		}
	}
	return outOfStockDays;
}

async function calculateMinInventory(product, status, sales, gap) {
	let period = 0;
	let minInventory = 100000;
	const shipmentTypes = product.shipmentTypes;
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
	// 查看第一种发货方式到货之后的最低库存
	//TODO 到货之前有断货和没有断货
	let period;
	let minInventory = 100000;
	let type = shipmentTypes[0];
	let shipmentType = ShipmentTypesInfo[type];
	for (let i = 0; i < status.length; i++) {
		if (status[i].period > shipmentType.period + purchase.expectDeliveryDays + GAP) {
			period = Math.floor(status[i].before / sales);
			if (period < minInventory) {
				minInventory = period;
			}
		}
	}
	return minInventory;
}

async function updateInboundQueueOutOfStockInfo(inboundQueue, sales) {
	let states = [];
	let newInboundQueue = helper.deepClone(inboundQueue);
	for (let i = 0; i < newInboundQueue.length; i++) {
		if (newInboundQueue[i].inventory.before < 0) {
			let outOfStockDays = helper.absCeil(newInboundQueue[i].inventory.before / sales);
			states.push({
				period: newInboundQueue[i].period - outOfStockDays,
				before: 0,
				after: 0,
			});

			let gap = Math.abs(newInboundQueue[i].inventory.before);
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

function addCurrentInventoryToInbounds(totalInventory, inbounds) {
	inbounds.push({
		quantity: totalInventory,
		period: 0,
	});
}

async function addShipmentPlanToInbounds(shipmentPlan, inbounds, product, purchase) {
	if (purchase) {
		let newInbounds = helper.deepClone(inbounds);
		for (let type in shipmentPlan) {
			if (shipmentPlan[type].boxCount > 0) {
				let shipment = {
					quantity: shipmentPlan[type].boxCount * product.unitsPerBox,
					period: purchase.expectDeliveryDays + ShipmentTypesInfo[type].period + GAP,
				};

				newInbounds.push({
					quantity: shipment.quantity,
					period: shipment.period,
				});
			}
		}
		return await sortQueue(newInbounds);
	} else {
		let newInbounds = helper.deepClone(inbounds);
		for (let type in shipmentPlan) {
			if (shipmentPlan[type].boxCount > 0) {
				let shipment = {
					quantity: shipmentPlan[type].boxCount * product.unitsPerBox,
					period: product.cycle + ShipmentTypesInfo[type].period + GAP,
				};
				newInbounds.push({
					quantity: shipment.quantity,
					period: shipment.period,
				});
			}
		}
		return await sortQueue(newInbounds);
	}
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
	return stock;
}

exports.getStockByProductV2 = getStockByProductV2;

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
			fbaInventory +
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

async function updateAll(productId) {
	if (productId) {
		const product = await Product.findById(productId);
		const productUpdator = new ProductUpdator(product);
		await productUpdator.updateAll();
	} else {
		const products = await Product.find();
		for (let product of products) {
			const productUpdator = new ProductUpdator(product);
			await productUpdator.updateAll();
		}
	}
}

function updateNewPurchaseShipmentPlanByPurchaseShipmentPlan(
	newPurchaseShipmentPlan,
	purchaseShipmentPlan,
) {
	const { gap, inventoryStatus, minInventory, totalAmount, inbounds } = purchaseShipmentPlan;

	const newPlan = {
		...newPurchaseShipmentPlan,
		gap,
		inventoryStatus,
		minInventory,
		totalAmount,
		inbounds,
	};

	return newPlan;
}

function convertShipmentsToInbounds(shipments) {
	let inbounds = [];
	shipments.forEach((shipment) => {
		inbounds.push({
			period: shipment.remainingArrivalDays + GAP,
			quantity: shipment.quantity,
		});
	});
	return inbounds;
}
async function getPlanV3(productId, purchaseCode) {
	ShipmentTypesInfo = await getShipmentTypes();
	let product = await Product.findById(productId);
	const productUpdator = new ProductUpdator(product);
	await productUpdator.updateAll();

	const { totalInventory, shipments, maxAvgSales, ps } = product;

	let inbounds = convertShipmentsToInbounds(shipments);
	addCurrentInventoryToInbounds(totalInventory, inbounds);

	const minTotalSalesPeriod = totalInventory / maxAvgSales;
	const maxTotalSalesPeriod = totalInventory / ps;

	let newPurchaseShipmentPlan = {
		orderedPurchaseShipmentPlans: [],
		gap: 0,
		inventoryStatus: [],
		minInventory: 0,
		totalAmount: 0,
		inbounds: [],
	};

	if (purchaseCode) {
		const purchase = product.purchases.find((purchase) => purchase.code === purchaseCode);
		if (!purchase) {
			return;
		}

		let purchaseShipmentPlan = await getPurchaseShipmentPlan(purchase, product, inbounds);

		newPurchaseShipmentPlan.orderedPurchaseShipmentPlans.push(purchaseShipmentPlan);
		newPurchaseShipmentPlan = updateNewPurchaseShipmentPlanByPurchaseShipmentPlan(
			newPurchaseShipmentPlan,
			purchaseShipmentPlan,
		);
	} else {
		const pruchases = helper.deepClone(product.purchases);

		let { orderedPurchaseShipmentPlansMetrics, orderedPurchaseShipmentPlans } =
			await getPurchaseShipmentPlans(pruchases, product, inbounds);
		if (product.quantityToPurchase.boxCount > 0) {
			if (orderedPurchaseShipmentPlans.length > 0) {
				newPurchaseShipmentPlan = await bestPlan(
					product,
					orderedPurchaseShipmentPlansMetrics.inbounds || [],
				);
				newPurchaseShipmentPlan.orderedPurchaseShipmentPlans = orderedPurchaseShipmentPlans;
			} else {
				newPurchaseShipmentPlan = await bestPlan(product, inbounds);
			}
		} else {
			console.log("Inventory is enough, do not need to purchase any more");
			if (orderedPurchaseShipmentPlans.length === 0) {
				return;
			} else {
				newPurchaseShipmentPlan = {
					orderedPurchaseShipmentPlans,
					...orderedPurchaseShipmentPlansMetrics,
				};
			}
		}
	}

	let volumeWeightCheck = true;

	for (let type in ShipmentTypesInfo) {
		if (type in newPurchaseShipmentPlan) {
			if (newPurchaseShipmentPlan[type].units && newPurchaseShipmentPlan[type].units > 0) {
				if (!checkVolumeWeight(product.box, type)) {
					volumeWeightCheck = false;
				}
			}
		}
	}

	console.log(await ShipmentType.find());
	const purchase = {
		plan: newPurchaseShipmentPlan,
		product: product,
		freights: await ShipmentType.find(),
		inboundShippeds: product.shipments,
		minTotalSalesPeriod: Math.ceil(minTotalSalesPeriod),
		maxTotalSalesPeriod: Math.ceil(maxTotalSalesPeriod),
		volumeWeightCheck: volumeWeightCheck,
	};

	return purchase;
}

async function getPurchaseShipmentPlan(purchase, product, inbounds) {
	const shipmentTypes = product.shipmentTypes;

	let shipmentPlan = {
		[shipmentTypes[0]]: {
			boxCount: purchase.boxCount,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: purchase.boxCount * ShipmentTypesInfo[shipmentTypes[0]].price * product.box.weight,
		expectDeliveryDate: purchase.expectDeliveryDate,
		createdAt: purchase.createdAt,
		expectDeliveryDays: purchase.expectDeliveryDays,
		orderId: purchase.orderId,
		code: purchase.code,
	};
	for (let i = 1; i < shipmentTypes.length; i++) {
		shipmentPlan[shipmentTypes[i]] = { boxCount: 0 };
	}

	let tempPlan = {};

	let result = {
		plan: shipmentPlan,
		status: "pending",
	};

	let step = Math.ceil(purchase.boxCount ** shipmentTypes.length / 60000000);

	await getShipmentPlanByPurchase(
		tempPlan,
		purchase.boxCount, // the boxCount that other shipment types need to ship
		0, // the index of shipment type
		inbounds,
		product,
		result,
		purchase,
		step,
	);
	return await formatPlan(result.plan, product.unitsPerBox, purchase);
}

async function prepareFbaInventoryAndSalesByCountryV2(asin, country, listings) {
	let availableQuantity = 0;
	let reservedFCTransfer = 0;
	let inboundShipped = 0;
	let sales = 0;
	let reservedFCProcessing = 0;
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

async function getPurchaseShipmentPlans(purchases, product, inbounds) {
	let orderedPurchaseShipmentPlansMetrics = {};
	let orderedPurchaseShipmentPlans = [];
	let newInbounds = helper.deepClone(inbounds);

	for (let i = 0; i < purchases.length; i++) {
		const shipmentPlan = await getPurchaseShipmentPlan(purchases[i], product, newInbounds);
		orderedPurchaseShipmentPlans.push(shipmentPlan);
		orderedPurchaseShipmentPlansMetrics.gap = shipmentPlan.gap;
		orderedPurchaseShipmentPlansMetrics.inventoryStatus = shipmentPlan.inventoryStatus;
		orderedPurchaseShipmentPlansMetrics.minInventory = shipmentPlan.minInventory;
		orderedPurchaseShipmentPlansMetrics.totalAmount = shipmentPlan.totalAmount;
		orderedPurchaseShipmentPlansMetrics.inbounds = shipmentPlan.inbounds;
	}
	return { orderedPurchaseShipmentPlansMetrics, orderedPurchaseShipmentPlans };
}

async function getOrderDue(product) {
	let orderDues = {};
	for (let type of product.shipmentTypes) {
		let shipment = ShipmentTypesInfo[type];
		orderDues[type] = moment().add(
			product.totalInventory / product.sales -
				product.cycle -
				shipment.period -
				GAP -
				product.minInventory,
			"days",
		);
	}

	//	let dues = [];
	//for (let type in orderDues) {
	//dues.push({
	//type: type,
	//		due: orderDues[type],
	//	});
	//}
	//return dues;
	return orderDues;
}

async function addCostToShipmentPlan(shipmentPlan, product) {
	let amount = 0;

	for (let type in shipmentPlan) {
		let shipmentType = ShipmentTypesInfo[type];
		shipmentPlan[type].amount = Math.ceil(
			shipmentPlan[type].boxCount * shipmentType.price * product.box.weight,
		);
		shipmentPlan[type].weight = Math.ceil(shipmentPlan[type].boxCount * product.box.weight);
		amount += shipmentPlan[type].amount;
	}
	shipmentPlan.totalAmount = amount;
	return shipmentPlan;
}

function checkVolumeWeight(box, shipmentType) {
	let volumeWeight;
	if (shipmentType.indexOf("sea") > 0) {
		volumeWeight = (box.length + box.width + box.height) / 5000;
	} else {
		volumeWeight = (box.length + box.width + box.height) / 6000;
	}
	return volumeWeight < 1.2 * box.weight;
}

async function formatPlan(plan, unitsPerBox, purchase) {
	for (let type in plan) {
		if (plan[type] && plan[type].boxCount) {
			plan[type].units = plan[type].boxCount * unitsPerBox;
		}
	}

	if (purchase) {
		plan.expectDeliveryDate = purchase.expectDeliveryDate;
		plan.createdAt = purchase.createdAt;
		plan.expectDeliveryDays = purchase.expectDeliveryDays;
		plan.orderId = purchase.orderId;
		plan.code = purchase.code;
	}
	return plan;
}

async function calculatePlan(shipmentPlan, inbounds, product, result) {
	let shipmentPlanMetrics = await getShipmentPlanMetrics(shipmentPlan, product, inbounds);

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
	if (shipmentPlanMetrics.minInventory >= product.minInventory && shipmentPlanMetrics.gap == 0) {
		// 最低库存已满足要求，并且没有断货，当前运输计划费用最低
		result.plan = helper.deepClone(shipmentPlanMetrics);
		result.status = "done";
		return;
	} else {
		if (result.plan.gap > 0) {
			// 已有的发货计划存在断货
			if (shipmentPlanMetrics.gap < result.plan.gap) {
				result.plan = helper.deepClone(shipmentPlanMetrics);
			} else if (shipmentPlanMetrics.gap === result.plan.gap) {
				if (result.plan.minInventory < product.minInventory) {
					if (shipmentPlanMetrics.minInventory > result.plan.minInventory) {
						result.plan = helper.deepClone(shipmentPlanMetrics);
					}
				}
			}
		} else {
			if (shipmentPlanMetrics.gap === 0) {
				if (result.plan.minInventory < product.minInventory) {
					if (shipmentPlanMetrics.minInventory > result.plan.minInventory) {
						result.plan = helper.deepClone(shipmentPlanMetrics);
					}
				}
			}
		}
	}

	return result;
}

async function calculatePurchaseShipmentPlan(shipmentPlan, inbounds, product, result, purchase) {
	let newPlan = await getShipmentPlanMetrics(shipmentPlan, product, inbounds, purchase);

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

async function getShipmentPlan(shipmentPlan, left, index, inbounds, product, result, step) {
	if (left < 0) {
		return;
	}
	if (result.status === "done") {
		return;
	}
	const shipmentTypes = product.shipmentTypes;
	if (index >= shipmentTypes.length - 1) {
		shipmentPlan[shipmentTypes[index]] = { boxCount: left };

		await calculatePlan(shipmentPlan, inbounds, product, result);
		if (result.status === "done") {
			return null;
		}
	} else {
		let i = 0;
		while (i <= left) {
			shipmentPlan[shipmentTypes[index]] = { boxCount: i };
			await getShipmentPlan(shipmentPlan, left - i, index + 1, inbounds, product, result, step);
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
	inbounds,
	product,
	result,
	purchase,
	step,
) {
	if (result.status === "done") {
		return null;
	}

	const shipmentTypes = product.shipmentTypes;

	if (index === shipmentTypes.length - 1) {
		shipmentPlan[shipmentTypes[index]] = { boxCount: left };

		await calculatePurchaseShipmentPlan(shipmentPlan, inbounds, product, result, purchase);

		if (result.status === "done") {
			return null;
		}
	} else {
		let i = 0;
		while (i <= left) {
			shipmentPlan[shipmentTypes[index]] = { boxCount: i };
			await getShipmentPlanByPurchase(
				shipmentPlan,
				left - i,
				index + 1,
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

async function bestPlan(product, inbounds) {
	const firstShipmentType = product.shipmentTypes[0];

	const shipmentType = ShipmentTypesInfo[firstShipmentType];
	console.log(ShipmentTypesInfo);

	let plan = {
		[firstShipmentType]: {
			boxCount: product.quantityToPurchase.boxCount,
		},
		gap: 100000,
		minInventory: -100,
		totalAmount: product.quantityToPurchase.boxCount * shipmentType.price * product.box.weight,
	};
	for (let i = 1; i < shipmentType.length; i++) {
		plan[shipmentType[i]] = { boxCount: 0 };
	}

	let shipmentPlan = {};
	let result = {
		plan: plan,
		status: "pending",
	};
	let step = Math.ceil(
		product.quantityToPurchase.boxCount ** product.shipmentTypes.length / 60000000,
	);
	await getShipmentPlan(
		shipmentPlan,
		product.quantityToPurchase.boxCount,
		0,
		inbounds,
		product,
		result,
		step,
	);

	return await formatPlan(result.plan, product.unitsPerBox);
}

async function getShipmentPlanMetrics(shipmentPlan, product, inbounds, purchase) {
	let newInbounds = await addShipmentPlanToInbounds(shipmentPlan, inbounds, product, purchase);
	let inventoryStatus = await getInventoryStatus(newInbounds, product.sales);
	const shipmentPlanDup = helper.deepClone(shipmentPlan);
	await addCostToShipmentPlan(shipmentPlanDup, product);

	shipmentPlanDup.gap = await calculateOutOfStockPeriod(inventoryStatus);

	if (purchase) {
		shipmentPlanDup.minInventory = await calculatePurchaseMinInventory(
			product.shipmentTypes,
			inventoryStatus,
			product.sales,
			purchase,
		);
	} else {
		shipmentPlanDup.minInventory = await calculateMinInventory(
			product,
			inventoryStatus,
			product.sales,
			shipmentPlanDup.gap,
		);
	}

	shipmentPlanDup.inventoryStatus = inventoryStatus;
	shipmentPlanDup.inbounds = newInbounds;
	return shipmentPlanDup;
}

const getProductByPlwhsId = async function (plwhsId) {
	return Product.findOne({ plwhsId })
		.clone()
		.catch(function (err) {
			console.log(err);
		});
};

async function createOrUpdateByPlwhsId(product) {
	let existProduct = await Product.findOne({ plwhsId: product.plwhsId });
	if (existProduct) {
		Object.assign(existProduct, product);
		await existProduct.save();
	} else {
		const newProduct = new Product(product);
		await newProduct.save();
	}
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

async function remove(productId) {
	await Product.deleteOne({ _id: mongoose.Types.ObjectId(productId) });
}

module.exports = {
	findById: Product.findById.bind(Product),
	find: Product.find.bind(Product),
	remove,
	prepareFbaInventoryAndSalesV3,
	newAndSave,
	createOrUpdate,
	getProductByPlwhsId,
	getOrderDue,
	getPurchaseShipmentPlan,
	prepareOrderDues,
	getPlanV3,
	findByUser,
	updateAll,
	createOrUpdateByPlwhsId,
	syncPm,
	prepareFbaInventoryAndSalesByCountryV2,
};
