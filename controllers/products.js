let Product = require("../proxy").Product;
let Csv = require("../proxy").Csv;
let Freight = require("../proxy").Freight;
let mongoose = require("mongoose");
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
	res.render("index", { title: "regist" });
};

exports.syncAllProductFreights = async function (req, res, next) {
	Product.syncAllProductFreights(2);
	res.render("index", { title: "regist" });
};
exports.show = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.getProductById(productId);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("product/show", {
			product: product,
			title: "",
		});
	}
};

exports.generateReport = async function (req, res, next) {
	let asin = req.params.productId;
	let product = await Product.getProductByAsin(asin);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		await Product.generateReport(asin);
		res.render("product/report", {
			product: product,
			title: "",
		});
	}
};

exports.freights = async function (req, res, next) {
	let asin = req.params.productId;
	let product = await Product.getProductByAsin(asin);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		Product.getFreight(product);
	}
};

exports.updateAllProuctSalesAndInventories = async function (req, res, next) {
	Product.updateAllProuctSalesAndInventories();
	res.render("index", { title: "regist" });
};

exports.updatePlan = async function (req, res, next) {
	let asin = req.params.productId;
	let plan = req.body.plan;
	let product = await Product.getProductByAsin(asin);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		product.plan = plan;
		await Product.save(product);
		res.redirect("/products/" + product.asin + "/showPlan");
	}
};

exports.syncFreight = async function (req, res, next) {
	let asin = req.params.productId;
	let product = await Product.getProductByAsin(asin);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		await Product.syncFreight(product, 10);
		await Product.save(product);
		res.redirect("/products/" + product.asin + "/inbounds");
	}
};

exports.delete = async function (req, res, next) {
	let asin = req.body.asin;
	let productId = req.body.productId;
	await Product.remove(asin, productId);
	res.redirect("/products");
};

exports.index = async function (req, res, next) {
	// let products = await Product.showAll();
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

exports.plan = async function (req, res, next) {
	let asin = req.params.productId;
	let purchase = await Product.getPlanV3(asin);
	if (purchase.plan) {
		res.render("product/plan", { purchase: purchase });
	} else {
		res.render("product/inventory");
	}
};

exports.showPlan = async function (req, res, next) {
	let asin = req.params.productId;
	let product = await Product.getProductByAsin(asin);
	if (product.plan) {
		res.render("product/plan", { purchase: JSON.parse(product.plan) });
	}
};

exports.producingPlan = async function (req, res, next) {
	let asin = req.params.productId;
	let producingId = req.params.producingId;
	let purchase = await Product.getPlanV3(asin, producingId);
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

exports.report = async function (req, res, next) {
	let asin = req.params.productId;
	let product = await Product.getProductByAsin(asin);
	await generateReport(asin);
	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("product/edit", {
			product: product,
			title: "",
		});
	}
};

exports.edit = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.getProductById(productId);

	if (!product) {
		res.render404("这个产品不存在。");
		return;
	} else {
		res.render("product/edit", {
			product: product,
			title: "",
		});
	}
};
exports.new = function (req, res, next) {
	console.log("new");
	res.render("product/new", {
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
	let product = await Product.getProductByAsin(asin);
	console.log(product);
	if (!product) {
		let newProduct = {
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
		Product.newAndSave(newProduct, function (err, product) {
			console.log(product);
			if (err) {
				return next(err);
			}
			res.redirect("/products");
		});
	} else {
		product.cycle = cycle;
		product.maxAvgSales = maxAvgSales;
		product.unitsPerBox = unitsPerBox;
		product.box = box;
		product.plwhsId = plwhsId;
		product.yisucangId = yisucangId;
		product.airDelivery = airDelivery;
		product.sea = sea;
		product.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect("/products/");
		});
	}
};

exports.save = async function (req, res, next) {
	let asin = req.body.asin;
	let cycle = req.body.cycle;
	let maxAvgSales = req.body.maxAvgSales;
	let unitsPerBox = req.body.unitsPerBox;
	let minInventory = req.body.minInventory;
	let discontinue = req.body.discontinue;
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
	let avgSales = req.body.avgSales;
	let product = await Product.getProductByAsin(asin);
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
			res.redirect("/products/" + product.asin);
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
			res.redirect("/products/" + product.asin);
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
	let asin = req.params.productId;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	console.log(quantity);
	let product = await Product.getProductByAsin(asin);
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
			res.redirect("/products/" + product.asin + "/inbounds");
		});
	}
};
exports.deleteInbound = async function (req, res, next) {
	let asin = req.params.productId;
	let inboundId = req.params.inboundId;
	console.log(inboundId);
	await Product.deleteInbound(inboundId);
	let product = await Product.getProductByAsin(asin);
	res.redirect("/products/" + product.asin + "/inbounds");
};
exports.deleteProducing = async function (req, res, next) {
	let asin = req.params.productId;
	let producingId = req.params.producingId;
	await Product.deleteProducing(producingId);
	let product = await Product.getProductByAsin(asin);
	res.redirect("/products/" + product.asin + "/inbounds");
};

exports.updateProducing = async function (req, res, next) {
	let asin = req.body.asin;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	let producingId = req.body.producingId;
	await Product.updateProducing(producingId, moment(deliveryDue).endOf("day"), quantity);
	res.redirect("/products/" + asin + "/inbounds");
};
exports.updateInbound = async function (req, res, next) {
	let asin = req.body.asin;
	let quantity = req.body.quantity;
	let deliveryDue = req.body.deliveryDue;
	let inboundId = req.body.inboundId;
	await Product.updateInbound(inboundId, deliveryDue, quantity);
	res.redirect("/products/" + asin + "/inbounds");
};
exports.showInbounds = async function (req, res, next) {
	let productId = req.params.productId;
	let product = await Product.getProductById(productId);
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
	let product = Product.getProductByAsin(asin);
	if (!product) {
		res.render404("此产品不存在或已被删除。");
		return;
	}
	product.cycle = cycle;
	product.maxAvgSales = maxAvgSales;
	product.unitsPerBox = unitsPerBox;
	product.box = box;

	product.countries = countries;
	console.log(countries);
	product.save(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect("/products/" + product.asin);
	});
};

exports.csv = async function (req, res, next) {
	let products = await Csv.parseCsv("ProductDailyProfit-10212022-11042022.csv");
	res.render("/product/csv", {
		products: products,
	});
};
