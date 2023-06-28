let models = require("../models");
const GProduct = models.GProduct;

async function createOrUpdate(gProduct) {
	let existProduct = await GProduct.findOne({ product: gProduct.product });

	if (existProduct) {
		Object.assign(existProduct, gProduct);
		await existProduct.save();
	} else {
		const newProduct = new GProduct(gProduct);
		await newProduct.save();
	}
}

module.exports = {
	createOrUpdate,
};
