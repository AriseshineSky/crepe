var models = require("../models");
var Purchase = models.Purchase;

async function formatPurchase(purchase) {
	return {
		orderId: `OR${purchase.id}`,
		qty: Number(purchase.qty),
		delivery: purchase.us_arrival_date,
		created: purchase.created,
	};
}

async function getPurchasesByProductId(productId) {
	var purchases = [];
	var plwhsPurchases = await plwhsPurchase.purchases(productId);
	for (var purchase of plwhsPurchases) {
		if (purchase.status !== "canceled") {
			purchases.push(await formatPurchase(purchase));
		}
	}
	return purchases;
}

async function all() {
	return await Purchase.find();
}

async function createOrUpdate(purchase) {
	let existPurchase = await Purchase.findOne({ code: purchase.code });

	if (existPurchase) {
		Object.assign(existPurchase, purchase);
		await existPurchase.save();
	} else {
		const newPurchase = new Purchase(purchase);
		await newPurchase.save();
	}
}

async function findOrUpdate() {}
module.exports = {
	createOrUpdate,
	findOrUpdate,
	all,
};
