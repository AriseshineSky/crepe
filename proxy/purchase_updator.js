const helper = require("../lib/util/helper");
const Delivery = require("./delivery");

class PurchaseUpdator {
	constructor(purchase) {
		this.purchase = purchase;
	}

	async updateDeliveries() {
		const deliveries = await Delivery.find({ purchase: this.purchase._id });
		this.purchase.deliveries = deliveries;
		await this.purchase.save();
	}

	async updateRemainingDeliveryDays() {
		this.purchase.expectArrivalDays = helper.convertDateToPeroid(this.purchase.expectDeliveryDate);
		await this.purchase.save();
	}

	async updateAll() {
		this.purchase.expectArrivalDays = helper.convertDateToPeroid(this.purchase.expectDeliveryDate);
		const deliveries = await Delivery.find({
			purchaseCode: this.purchase.code,
			status: { $ne: "cancelled" },
		});
		this.purchase.deliveries = deliveries;

		const shippedQuantity = deliveries.reduce((sum, delivery) => {
			return sum + delivery.quantity;
		}, 0);

		this.purchase.shippedQuantity = shippedQuantity;
		this.purchase.unshippedQuantity = this.purchase.totalQuantity - shippedQuantity;
		console.log(this.purchase.unshippedQuantity);
		await this.purchase.save();
	}
}

module.exports = PurchaseUpdator;