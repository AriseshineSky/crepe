const models = require("../models");
const Product = models.Product;
const User = require("./user");
const moment = require("moment");
const GAP = 6;
const helper = require("../lib/util/helper");
const Listing = require("./listing");
const Yisucang = require("./yisucang");
const Purchase = require("./purchase");
const Purchase = require("./purchase");
const logger = require("../common/logger");

class PurchaseUpdator {
	constructor(purchase) {
		this.purchase = purchase;
	}

	async updateRemainingDeliveryDays() {
		this.purchase.expectArrivalDays = helper.convertDateToPeroid(this.purchase.expectDeliveryDate);
		await this.purchase.save();
	}
}

module.exports = PurchaseUpdator;
