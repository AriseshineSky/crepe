const models = require("../models");
const Yisucang = models.Yisucang;

const productsApi = require("../api/yisucang/products");
const inventoriesApi = require("../api/yisucang/inventories");

exports.syncYisucang = async function () {
	let yiProducts = await productsApi.yisucangProducts();
	let inventories = await inventoriesApi.inventories();

	for (let yiProduct of yiProducts) {
		let yiInventory = inventories.find(function (inventory) {
			return inventory.UPC == yiProduct.UPC;
		});
		if (yiInventory) {
			const yisucangId = yiProduct.ID.toString();
			const inventory = yiInventory.SumNumber;
			await createOrUpdate({ yisucangId, inventory });
		}
	}
};

exports.findAll = async function () {
	return await Yisucang.find({});
};

async function findYisucangById(yisucangId) {
	return await Yisucang.findOne({ yisucangId: yisucangId });
}
exports.findYisucangById = findYisucangById;

async function createOrUpdate({ yisucangId, inventory }) {
	let savedYisucang = await Yisucang.findOne({
		yisucangId,
	});
	if (savedYisucang) {
		savedYisucang.inventory = inventory;
		return await savedYisucang.save();
	} else {
		const yisucang = new Yisucang({ yisucangId, inventory });
		return await yisucang.save();
	}
}

async function findOrCreate(yisucangId) {
	console.log(yisucangId);
	let savedYisucang = await Yisucang.findOne({
		yisucangId,
	});
	if (savedYisucang) {
		return savedYisucang;
	} else {
		const yisucang = new Yisucang({ yisucangId });
		return await yisucang.save();
	}
}
exports.findOrCreate = findOrCreate;
exports.createOrUpdate = createOrUpdate;
