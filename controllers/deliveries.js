let Delivery = require("../proxy").Delivery;
let moment = require("moment");
let logger = require("../common/logger");

exports.index = async function (req, res, next) {
	const deliveries = await Delivery.all();
	res.render("delivery/index", {
		deliveries: deliveries,
	});
};
