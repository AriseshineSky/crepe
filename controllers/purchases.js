let Purchase = require("../proxy").Purchase;
let Csv = require("../proxy").Csv;
let Freight = require("../proxy").Freight;
let mongoose = require("mongoose");
let moment = require("moment");
let syncpurchases = require("../lib/getInfoFromGoogleSheet");
let logger = require("../common/logger");

let syncPurchaseOrders = require("../lib/syncPurchaseOrders");

exports.updateAllStock = async function (req, res, next) {
	purchase.updateAllStock();
	res.render("index", { title: "regist" });
};
exports.updateAllStockByAsin = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	purchase.updateAllStock(purchaseId);
	purchase.updatepurchaseSalesAndInventories(purchaseId);
	res.render("index", { title: "regist" });
};

exports.syncAllpurchaseFreights = async function (req, res, next) {
	purchase.syncAllpurchaseFreights(2);
	res.render("index", { title: "regist" });
};
exports.show = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let purchase = await purchase.getpurchaseById(purchaseId);
	syncPurchaseOrders.syncPurchaseOrders();
	if (!purchase) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("purchase/show", {
			purchase: purchase,
			title: "",
		});
	}
};

exports.freights = async function (req, res, next) {
	let asin = req.params.purchaseId;
	let purchase = await purchase.getpurchaseByAsin(asin);
	if (!purchase) {
		res.render404("这个产品不存在。");
		return;
	} else {
		purchase.getFreight(purchase);
	}
};

exports.updateAllProuctSalesAndInventories = async function (req, res, next) {
	purchase.updateAllpurchaseSalesAndInventories();
	res.render("index", { title: "regist" });
};

exports.updatePlan = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let plan = req.body.plan;
	let purchase = await purchase.getpurchaseById(purchaseId);
	if (!purchase) {
		res.render404("这个产品不存在。");
		return;
	} else {
		purchase.plan = plan;
		await purchase.save(purchase);
		res.redirect("/purchases/" + purchase.id + "/showPlan");
	}
};

exports.syncFreight = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let purchase = await purchase.getpurchaseById(purchaseId);
	if (!purchase) {
		res.render404("这个产品不存在。");
		return;
	} else {
		await purchase.syncFreight(purchase, 10);
		await purchase.save(purchase);
		res.redirect("/purchases/" + purchaseId + "/inbounds");
	}
};

exports.delete = async function (req, res, next) {
	let asin = req.body.asin;
	let purchaseId = req.body.purchaseId;
	await purchase.remove(asin, purchaseId);
	res.redirect("/purchases");
};

exports.index = async function (req, res, next) {
	const purchases = await Purchase.all();
	res.render("purchase/index", {
		purchases: purchases,
	});
};

exports.sync = async function (req, res, next) {
	syncpurchases.syncpurchases();
	res.render("index");
};

exports.updatepurchaseProducingStatus = async function (req, res, next) {
	purchase.updatepurchaseProducingStatus();
	res.render("index");
};
exports.syncpm = async function (req, res, next) {
	purchase.syncPm();
	res.render("index");
};

exports.syncPmBypurchase = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	await purchase.syncPmBypurchase(purchaseId);
	res.redirect("/purchases/" + purchaseId);
};

exports.plan = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let purchase = await purchase.getPlanV3(purchaseId);
	if (purchase.plan) {
		res.render("purchase/plan", { purchase: purchase });
	} else {
		res.render("purchase/inventory");
	}
};

exports.showPlan = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let purchase = await purchase.getpurchaseById(purchaseId);
	if (purchase.plan) {
		res.render("purchase/plan", { purchase: JSON.parse(purchase.plan) });
	}
};

exports.producingPlan = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let producingId = req.params.producingId;
	let purchase = await purchase.getPlanV3(purchaseId, producingId);
	if (purchase.plan) {
		res.render("purchase/plan", { purchase: purchase });
	} else {
		res.render("purchase/inventory");
	}
};

exports.producingsPlan = async function (req, res, next) {
	let asin = req.params.purchaseId;
	let purchase = await purchase.getProducingsPlan(asin);
	if (purchase.plan) {
		res.render("purchase/plan", { purchase: purchase });
	} else {
		res.render("purchase/inventory");
	}
};

exports.new = function (req, res, next) {
	console.log("new");
	res.render("purchase/new", {
		title: "New",
	});
};

exports.create = async function (req, res, next) {
	let asin = req.body.asin;
	let cycle = req.body.cycle;
	let maxAvgSales = req.body.maxAvgSales;
	let unitsPerBox = req.body.unitsPerBox;
	let box = {
		length: req.body["box.length"],
		width: req.body["box.width"],
		height: req.body["box.height"],
		weight: req.body["box.weight"],
	};
	let plwhsId = req.body.plwhsId;
	let yisucangId = req.body.yisucangId;
	let airDelivery = req.body.airDelivery;
	let sea = req.body.sea;
	let purchase = await purchase.getpurchaseByAsin(asin);
	console.log(purchase);
	if (!purchase) {
		let newpurchase = {
			asin: asin,
			cycle: cycle,
			unitsPerBox: unitsPerBox,
			box: box,
			maxAvgSales: maxAvgSales,
			plwhsId: plwhsId,
			yisucangId: yisucangId,
			airDelivery: airDelivery,
			sea: sea,
		};
		purchase.newAndSave(newpurchase, function (err, purchase) {
			console.log(purchase);
			if (err) {
				return next(err);
			}
			res.redirect("/purchases");
		});
	} else {
		purchase.cycle = cycle;
		purchase.maxAvgSales = maxAvgSales;
		purchase.unitsPerBox = unitsPerBox;
		purchase.box = box;
		purchase.plwhsId = plwhsId;
		purchase.yisucangId = yisucangId;
		purchase.airDelivery = airDelivery;
		purchase.sea = sea;
		purchase.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect("/purchases/");
		});
	}
};

exports.save = async function (req, res, next) {
	let purchaseId = req.body.id;
	let asin = req.body.asin;
	let cycle = req.body.cycle;
	let maxAvgSales = req.body.maxAvgSales;
	let unitsPerBox = req.body.unitsPerBox;
	let minInventory = req.body.minInventory;
	let discontinue = req.body.discontinue ? req.body.discontinue : false;
	let box = {
		length: req.body["box.length"],
		width: req.body["box.width"],
		height: req.body["box.height"],
		weight: req.body["box.weight"],
	};
	let plwhsId = req.body.plwhsId;
	let yisucangId = req.body.yisucangId;
	console.log("yi", yisucangId);
	let airDelivery = req.body.airDelivery;
	let sea = req.body.sea;
	let avgSales = req.body.avgSales;
	let purchase = await purchase.getpurchaseById(purchaseId);
	const countries = req.body.countries;
	console.log(purchase);
	if (!purchase) {
		let newpurchase = {
			asin: asin,
			cycle: cycle,
			unitsPerBox: unitsPerBox,
			box: box,
			maxAvgSales: maxAvgSales,
			plwhsId: plwhsId,
			avgSales: avgSales,
			yisucangId: yisucangId,
			airDelivery: airDelivery,
			sea: sea,
			minInventory: minInventory,
		};
		purchase.newAndSave(newpurchase, function (err, purchase) {
			console.log(purchase);
			if (err) {
				return next(err);
			}
			console.log(purchase.asin);
			res.redirect("/purchases/" + purchase.id);
		});
	} else {
		console.log(asin);
		purchase.asin = asin;
		purchase.cycle = cycle;
		purchase.avgSales = avgSales;
		purchase.maxAvgSales = maxAvgSales;
		purchase.unitsPerBox = unitsPerBox;
		purchase.box = box;
		purchase.plwhsId = plwhsId;
		purchase.yisucangId = yisucangId;
		purchase.airDelivery = airDelivery;
		purchase.sea = sea;
		purchase.discontinue = discontinue;
		purchase.minInventory = minInventory;
		purchase.countries = countries;
		purchase.save(function (err) {
			if (err) {
				return next(err);
			}
			console.log(purchase.asin);
			res.redirect("/purchases/" + purchaseId);
		});
	}
};

exports.put = async function (req, res, next) {
	let asin = req.body.asin;
	let cycle = req.body.cycle;
	let maxAvgSales = req.body.maxAvgSales;
	let unitsPerBox = req.body.unitsPerBox;
	let box = {
		length: req.body["box.length"],
		width: req.body["box.width"],
		height: req.body["box.height"],
		weight: req.body["box.weight"],
	};
	let purchase = await purchase.getpurchaseByAsin(asin);
	if (!purchase) {
		purchase.newAndSave(asin, cycle, unitsPerBox, box, maxAvgSales, function (err, purchase) {
			if (err) {
				return next(err);
			}
			res.redirect("/purchases/" + purchase.asin);
		});
	} else {
		purchase.cycle = cycle;
		purchase.maxAvgSales = maxAvgSales;
		purchase.unitsPerBox = unitsPerBox;
		purchase.box = box;

		purchase.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect("/purchases/" + purchase.asin);
		});
	}
};

exports.addInbound = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	console.log(quantity);
	let purchase = await purchase.getpurchaseById(purchaseId);
	if (!purchase) {
		return;
	} else {
		purchase.inboundShippeds.push({
			quantity: quantity,
			deliveryDue: deliveryDue,
		});
		purchase.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect("/purchases/" + purchaseId + "/inbounds");
		});
	}
};
exports.deleteInbound = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let inboundId = req.params.inboundId;
	console.log(inboundId);
	await purchase.deleteInbound(inboundId);
	res.redirect("/purchases/" + purchaseId + "/inbounds");
};
exports.deleteProducing = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let producingId = req.params.producingId;
	await purchase.deleteProducing(producingId);
	res.redirect("/purchases/" + purchaseId + "/inbounds");
};

exports.updateProducing = async function (req, res, next) {
	let purchaseId = req.body.purchaseId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	let producingId = req.body.producingId;
	await purchase.updateProducing(producingId, moment(deliveryDue).endOf("day"), quantity);
	res.redirect("/purchases/" + purchaseId + "/inbounds");
};
exports.updateInbound = async function (req, res, next) {
	let purchaseId = req.body.purchaseId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	let inboundId = req.body.inboundId;
	await purchase.updateInbound(inboundId, deliveryDue, quantity);
	res.redirect("/purchases/" + purchaseId + "/inbounds");
};
exports.showInbounds = async function (req, res, next) {
	let purchaseId = req.params.purchaseId;
	let purchase = await purchase.getpurchaseById(purchaseId);
	console.log(purchase);
	if (!purchase) {
		return;
	} else {
		res.render("purchase/inbound", {
			inbounds: purchase.inboundShippeds,
			purchase: purchase,
		});
	}
};

exports.update = function (req, res, next) {
	let asin = req.body.asin;
	let cycle = req.body.cycle;
	let maxAvgSales = req.body.maxAvgSales;
	let unitsPerBox = req.body.unitsPerBox;
	let box = {
		length: req.body["box.length"],
		width: req.body["box.width"],
		height: req.body["box.height"],
		weight: req.body["box.weight"],
	};
	const countries = req.body.countries;
	let purchase = purchase.getpurchaseByAsin(asin);
	if (!purchase) {
		res.render404("此产品不存在或已被删除。");
		return;
	}
	purchase.cycle = cycle;
	purchase.maxAvgSales = maxAvgSales;
	purchase.unitsPerBox = unitsPerBox;
	purchase.box = box;

	purchase.countries = countries;
	console.log(countries);
	purchase.save(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect("/purchases/" + purchase.asin);
	});
};

exports.csv = async function (req, res, next) {
	let purchases = await Csv.parseCsv("purchaseDailyProfit-10212022-11042022.csv");
	res.render("/purchase/csv", {
		purchases: purchases,
	});
};
