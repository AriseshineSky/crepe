let moment = require("moment");

class ProductCalculator {
	constructor(product) {
		this.product = product;
		this.undeliveredDeliveris = null;
		this.unshippedPurchases = null;
		this.GAP = 6
	}

	async getSalesPeriod() {
		if (this.product.ps === 0) {
			return 1000000;
		}
		const { fbaInventory, yisucangInventory, plwhsInventory, unshippedQty, undeliveredQty, ps, minInventory, cycle } = this.product;
		const stock = fbaInventory + yisucangInventory + plwhsInventory + unshippedQty + undeliveredQty;
		return	stock / ps - cycle - shipmentType.period - this.GAP - minInventory,
	}

	async getOrderDue() {
		let orderDues = {};
		const {salesPeriod, cycle, minInventory} = this.product
		for (const type of this.product.shipmentTypes) {
			const shipmentType = await ShipmentType.findOne({ name: type });
			orderDues[type] = moment().add(salesPeriod - cycle - shipmentType.period - this.GAP - minInventory,
				"days",
			);
		}
		return orderDues;
	}
}

module.exports = ProductCalculator;

