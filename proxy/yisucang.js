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
			let product = await findOrCreate(yiProduct.ID.toString());
			console.log(yiInventory);
			product.inventory = yiInventory.SumNumber;
			product.save();
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

async function findOrCreate(yisucangId) {
	console.log(yisucangId);
	let savedYisucang = await Yisucang.findOne({
		yisucangId,
	});
	if (savedYisucang) {
		return savedYisucang;
	} else {
		yisucang = new Yisucang();
		yisucang.yisucangId = yisucangId;
		return await yisucang.save();
	}
}
exports.findOrCreate = findOrCreate;
