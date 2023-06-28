let models = require("../models");
const Lot = models.Lot;

async function createOrUpdate(lot) {
	let existLot = await Lot.findOne({ code: lot.lot });

	if (existLot) {
		Object.assign(existLot, lot);
		await existLot.save();
	} else {
		const newLot = new Lot(lot);
		await newLot.save();
	}
}

module.exports = {
	createOrUpdate,
};
