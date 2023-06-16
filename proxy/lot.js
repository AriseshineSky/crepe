let models = require("../models");
const Lot = models.Lot;
let mongoose = require("mongoose");
let moment = require("moment");
const GAP = 6;
let getFbaInventoryByASIN = require("../lib/getFbaInventoryByASIN");
let getPlwhsByProduct = require("../lib/getPlwhsByProduct");
let Freight = require("./freight");
let Listing = require("./listing");
let Yisucang = require("./yisucang");
let logger = require("../common/logger");
const mysql = require("mysql2");

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
