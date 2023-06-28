const helper = require("../lib/util/helper");

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
