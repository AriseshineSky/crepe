const models = require("../models");
const Supplier = models.Supplier;

async function all() {
	return await Supplier.find();
}

async function createOrUpdate(supplier) {
	let existSupplier = await Supplier.findOne({ code: supplier.code });

	if (existSupplier) {
		Object.assign(existSupplier, supplier);
		await existSupplier.save();
	} else {
		const newSupplier = new Supplier(supplier);
		await newSupplier.save();
	}
}

module.exports = {
	createOrUpdate,
	all,
};
