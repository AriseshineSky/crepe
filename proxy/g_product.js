let models = require("../models");
const GProduct = models.GProduct;
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
