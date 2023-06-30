let Delivery = require("../proxy").Delivery;
let moment = require("moment");
let logger = require("../common/logger");

exports.index = async function (req, res, next) {
	const deliveries = await Delivery.all();
	res.render("delivery/index", {
		deliveries: deliveries,
	});
};

exports.new = async function (req, res, next) {
	res.render("delivery/new");
};

exports.create = async (req, res, next) => {
	const {
		memo,
		box,
		totalBoxes,
		quantity,
		shipmentDate,
		estimateArrivePortDate,
		expectArrivalDate,
		remainingArrivalDays,
		product,
	} = req.body;

	const newDelivery = {
		memo,
		box,
		totalBoxes,
		quantity,
		shipmentDate,
		estimateArrivePortDate,
		expectArrivalDate,
		remainingArrivalDays,
		product,
	};

	const delivery = await Delivery.createOrUpdate(newDelivery);
	res.redirect("/deliveries/" + delivery._id);
};
