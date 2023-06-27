const ShipmentType = require("../proxy").ShipmentType;
const Product = require("../proxy").Product;

exports.list = async function (req, res, next) {
	const shipmentTypes = await ShipmentType.all();
	res.render("shipment_type/index", {
		shipmentTypes: shipmentTypes,
	});
};

exports.types = async function (req, res, next) {
	const shipmentTypes = await ShipmentType.all();
	res.render("shipment_type/index", {
		shipmentTypes: shipmentTypes,
	});
};
exports.sync = async function (req, res, next) {
	await Freight.syncFreightTypes();
	res.redirect("/freights/types");
};
exports.syncAll = async function (req, res, next) {
	await Product.syncAllProductFreights(2);
	res.redirect("/freights/types");
};
