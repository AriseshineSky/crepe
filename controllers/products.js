let Product = require("../proxy").Product;
let moment = require("moment");
let syncProducts = require("../lib/getInfoFromGoogleSheet");
let logger = require("../common/logger");

exports.updateAllStock = async function (req, res, next) {
	Product.updateAllStock();
	res.render("index", { title: "regist" });
};

exports.updateAllStockByAsin = async function (req, res, next) {
	let productId = req.params.productId;
	Product.updateAllStock(productId);
	Product.updateProductSalesAndInventories(productId);
	res.render("index", { title: "regist" });
};

exports.syncAllProductFreights = async function (req, res, next) {
	Product.syncAllProductFreights(2);
	res.render("index", { title: "regist" });
};

exports.show = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.findProductById(productId);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("product/show", {
			product: product,
		});
	}
};

exports.updateAllProuctSalesAndInventories = async function (req, res, next) {
	Product.updateAllProductSalesAndInventories();
	res.render("index", { title: "regist" });
};

exports.updatePlan = async function (req, res, next) {
	let productId = req.params.productId;
	let plan = req.body.plan;
	let product = await Product.findProductById(productId);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		product.plan = plan;
		await Product.save(product);
		res.redirect("/products/" + product.id + "/showPlan");
	}
};

exports.syncFreight = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.findProductById(productId);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		await Product.syncFreight(product, 10);
		await Product.save(product);
		res.redirect("/products/" + productId + "/inbounds");
	}
};

exports.delete = async function (req, res, next) {
	let productId = req.body.productId;
	await Product.remove(productId);
	res.redirect("/products");
};

exports.index = async function (req, res, next) {
	const products = await Product.findByUser(req.user);
	res.render("product/index", {
		products: products,
	});
};

exports.sync = async function (req, res, next) {
	syncProducts.syncProducts();
	res.render("index");
};

exports.updateProductProducingStatus = async function (req, res, next) {
	Product.updateProductProducingStatus();
	res.render("index");
};
exports.syncpm = async function (req, res, next) {
	Product.syncPm();
	res.render("index");
};

exports.syncPmByProduct = async function (req, res, next) {
	let productId = req.params.productId;
	await Product.syncPmByProduct(productId);
	res.redirect("/products/" + productId);
};

exports.plan = async function (req, res, next) {
	let productId = req.params.productId;
	let purchase = await Product.getPlanV3(productId);
	if (purchase.plan) {
		res.render("product/plan", { purchase: purchase });
	} else {
		res.render("product/inventory");
	}
};

exports.showPlan = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.findProductById(productId);
	if (product.plan) {
		res.render("product/plan", { purchase: JSON.parse(product.plan) });
	}
};

exports.producingPlan = async function (req, res, next) {
	let productId = req.params.productId;
	let producingId = req.params.producingId;
	let purchase = await Product.getPlanV3(productId, producingId);
	if (purchase.plan) {
		res.render("product/plan", { purchase: purchase });
	} else {
		res.render("product/inventory");
	}
};

exports.producingsPlan = async function (req, res, next) {
	let asin = req.params.productId;
	let purchase = await Product.getProducingsPlan(asin);
	if (purchase.plan) {
		res.render("product/plan", { purchase: purchase });
	} else {
		res.render("product/inventory");
	}
};

exports.edit = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.findProductById(productId);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("product/edit", {
			product: product,
		});
	}
};

exports.new = function (req, res, next) {
	res.render("product/new", {
		title: "New",
	});
};

exports.create = async function (req, res, next) {
	const {
		asin,
		cycle,
		maxAvgSales,
		unitsPerBox,
		box,
		plwhsId,
		yisucangId,
		sea,
		air,
		airDelivery,
		seaExpress,
	} = req.body;

	const newProduct = {
		asin,
		cycle,
		maxAvgSales,
		unitsPerBox,
		box,
		plwhsId,
		yisucangId,
		sea,
		air,
		airDelivery,
		seaExpress,
	};

	const product = await Product.newAndSave(newProduct);
	res.redirect("/products" + product._id);
};

exports.save = async function (req, res, next) {
	let productId = req.body.id;
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
	let product = await Product.findProductById(productId);
	const countries = req.body.countries;
	console.log(product);
	if (!product) {
		let newProduct = {
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
		Product.newAndSave(newProduct, function (err, product) {
			console.log(product);
			if (err) {
				return next(err);
			}
			console.log(product.asin);
			res.redirect("/products/" + product.id);
		});
	} else {
		console.log(asin);
		product.asin = asin;
		product.cycle = cycle;
		product.avgSales = avgSales;
		product.maxAvgSales = maxAvgSales;
		product.unitsPerBox = unitsPerBox;
		product.box = box;
		product.plwhsId = plwhsId;
		product.yisucangId = yisucangId;
		product.airDelivery = airDelivery;
		product.sea = sea;
		product.discontinue = discontinue;
		product.minInventory = minInventory;
		product.countries = countries;
		product.save(function (err) {
			if (err) {
				return next(err);
			}
			console.log(product.asin);
			res.redirect("/products/" + productId);
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
	let product = await Product.getProductByAsin(asin);
	if (!product) {
		Product.newAndSave(asin, cycle, unitsPerBox, box, maxAvgSales, function (err, product) {
			if (err) {
				return next(err);
			}
			res.redirect("/products/" + product.asin);
		});
	} else {
		product.cycle = cycle;
		product.maxAvgSales = maxAvgSales;
		product.unitsPerBox = unitsPerBox;
		product.box = box;

		product.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect("/products/" + product.asin);
		});
	}
};

exports.addInbound = async function (req, res, next) {
	let productId = req.params.productId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	console.log(quantity);
	let product = await Product.findProductById(productId);
	if (!product) {
		return;
	} else {
		product.inboundShippeds.push({
			quantity: quantity,
			deliveryDue: deliveryDue,
		});
		product.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect("/products/" + productId + "/inbounds");
		});
	}
};
exports.deleteInbound = async function (req, res, next) {
	let productId = req.params.productId;
	let inboundId = req.params.inboundId;
	console.log(inboundId);
	await Product.deleteInbound(inboundId);
	res.redirect("/products/" + productId + "/inbounds");
};
exports.deleteProducing = async function (req, res, next) {
	let productId = req.params.productId;
	let producingId = req.params.producingId;
	await Product.deleteProducing(producingId);
	res.redirect("/products/" + productId + "/inbounds");
};

exports.updateProducing = async function (req, res, next) {
	let productId = req.body.productId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	let producingId = req.body.producingId;
	await Product.updateProducing(producingId, moment(deliveryDue).endOf("day"), quantity);
	res.redirect("/products/" + productId + "/inbounds");
};
exports.updateInbound = async function (req, res, next) {
	let productId = req.body.productId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	let inboundId = req.body.inboundId;
	await Product.updateInbound(inboundId, deliveryDue, quantity);
	res.redirect("/products/" + productId + "/inbounds");
};
exports.showInbounds = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.findProductById(productId);
	console.log(product);
	if (!product) {
		return;
	} else {
		res.render("product/inbound", {
			inbounds: product.inboundShippeds,
			product: product,
		});
	}
};

exports.update = async function (req, res, next) {
	const {
		asin,
		cycle,
		maxAvgSales,
		unitsPerBox,
		box,
		plwhsId,
		yisucangId,
		productId,
		sea,
		air,
		airDelivery,
		seaExpress,
	} = req.body;

	const product = {
		asin,
		cycle,
		maxAvgSales,
		unitsPerBox,
		box,
		plwhsId,
		yisucangId,
		sea,
		air,
		airDelivery,
		seaExpress,
		productId,
	};

	await Product.createOrUpdate(product);
	res.redirect("/products" + product.productId);
};
