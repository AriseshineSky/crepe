const models = require("../models");
const Product = models.Product;
const User = require("./user");
const moment = require("moment");
const GAP = 6;
const helper = require("../lib/util/helper");
const Listing = require("./listing");
const Yisucang = require("./yisucang");
const Purchase = require("./purchase");
const Delivery = require("./delivery");
const logger = require("../common/logger");

class DeliveryUpdator {
	constructor(delivery) {
		this.delivery = delivery;
	}

	async updatePurchase() {
		this.delivery.remainingArrivalDays = helper.convertDateToPeroid(
			this.delivery.expectArrivalDate,
		);
		await this.delivery.save();
	}

	async updateRemainingArrivalDays() {
		this.delivery.remainingArrivalDays = helper.convertDateToPeroid(
			this.delivery.expectArrivalDate,
		);
		await this.delivery.save();
	}
}

module.exports = DeliveryUpdator;
