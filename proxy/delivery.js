const models = require("../models");
const Purchase = models.Purchase;
const Delivery = models.Delivery;

const batchSize = 200;

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

function getDeliveryCode(code) {
	if (!code) {
		return null;
	}
	return code.split("-")[0];
}

async function updateDeliveryPurchaseId() {
	let deliveries = await all();
	for (let delivery of deliveries) {
		const purchase = await Purchase.findOne({ code: getDeliveryCode(delivery.memo) });
		if (purchase) {
			delivery.purchase = purchase._id;
			await delivery.save();
		}
	}
}

async function all() {
	return await Delivery.find({});
}

exports.findAll = async function () {
	return await Delivery.find({});
};

async function findDeliveryById(deliveryId) {
	return await Delivery.findOne({ deliveryId: deliveryId });
}
exports.findDeliveryById = findDeliveryById;

async function createOrUpdate(delivery) {
	let existDelivery = await Delivery.findOne({ code: delivery.code });

	if (existDelivery) {
		Object.assign(existDelivery, delivery);
		await existDelivery.save();
	} else {
		const newDelivery = new Delivery(delivery);
		await newDelivery.save();
	}
}

async function findByProductId(productId) {
	return Delivery.find({ product: productId }).populate("product").exec();
}
async function findUndeliveredByProduct(product) {
	return Delivery.find({ product: product.id });
}

module.exports = {
	all,
	createOrUpdate,
	updateDeliveryPurchaseId,
	findByProductId,
	findUndeliveredByProduct,
};
