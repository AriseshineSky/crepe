const models = require("../models");
const Product = models.Product;
const User = require("./user");
const moment = require("moment");
const GAP = 6;
const helper = require("../lib/util/helper");
const Listing = require("./listing");
const YisucangInbound = require("./yisucang_inbound");
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

	async updateDeliveredQuantity() {
		const yisucangInbounds = await YisucangInbound.find({
			logisticsTrackingNumber: this.delivery.logisticsTrackingNumber,
		});

		this.delivery.receivedBoxes = yisucangInbounds.reduce(
			(receivedBoxes, inbound) => receivedBoxes + inbound.boxCount,
			0,
		);
		this.delivery.unreceivedBoxes = this.delivery.totalBoxes - this.delivery.receivedBoxes;
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
