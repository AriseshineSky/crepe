let Delivery = require("../proxy").Delivery;
let moment = require("moment");
let logger = require("../common/logger");

exports.index = async function (req, res, next) {
	const deliveries = await Delivery.all();
	res.render("delivery/index", {
		deliveries: deliveries,
	});
};

exports.edit = async function (req, res, next) {
	let deliveryId = req.params.deliveryId;
	let delivery = await Delivery.findById(deliveryId);
	console.log("delivery", delivery);
	if (!delivery) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("delivery/edit", {
			delivery: delivery,
		});
	}
};

exports.show = async function (req, res, next) {
	let deliveryId = req.params.deliveryId;
	let delivery = await Delivery.findById(deliveryId);
	if (!delivery) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("delivery/show", {
			delivery: delivery,
		});
	}
};

exports.delete = async function (req, res, next) {
	let deliveryId = req.body.deliveryId;
	await Delivery.remove(deliveryId);
	res.redirect("/deliveries");
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
