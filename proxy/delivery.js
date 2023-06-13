const models = require("../models");
const Delivery = models.Delivery;

const productsApi = require("../api/delivery/products");
const inventoriesApi = require("../api/delivery/inventories");
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
		const totalCount = await Delivery.countDocuments({})
		const totalPage = Math.ceil(totalCount / batchSize)
		for (let page = 1; page <= totalPage; page++) {
			const deliveries = await Delivery.find({}, {deliveryCode: 1}).skip((page - 1) * batchSize).limit(batchSize)
			const deliveryCodes = deliveries.map(delivery => delivery.deliveryCode)
			await 
		}
	}
}
exports.findAll = async function () {
	return await Delivery.find({});
};

async function findDeliveryById(deliveryId) {
	return await Delivery.findOne({ deliveryId: deliveryId });
}
exports.findDeliveryById = findDeliveryById;

async function findOrCreate(deliveryId) {
	let savedDelivery = await Delivery.findOne({
		deliveryId,
	});
	if (savedDelivery) {
		return savedDelivery;
	} else {
		delivery = new Delivery();
		delivery.deliveryId = deliveryId;
		return await delivery.save();
	}
}
exports.findOrCreate = findOrCreate;
