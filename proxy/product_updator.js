const models = require("../models");
const Product = models.Product;
const DeliveryUpdator = require("./delivery_updator");
const PurchaseUpdator = require("./purchase_updator");
const moment = require("moment");
const GAP = 6;
const getPlwhsByProduct = require("../lib/getPlwhsByProduct");
const ShipmentType = require("./shipment_type");
const Listing = require("./listing");
const Yisucang = require("./yisucang");
const Purchase = require("./purchase");
const Delivery = require("./delivery");
const logger = require("../common/logger");

const ShipmentTypesInfo = {
	airExpress: {
		price: 55,
		period: 8,
	},
	airDelivery: {
		price: 55,
		period: 8,
	},
	seaExpress: {
		price: 55,
		period: 8,
	},
	sea: {
		price: 55,
		period: 8,
	},
};

class ProductUpdator {
	constructor(product) {
		this.product = product;
	}

	static ORDER = {
		airExpress: 1,
		airDelivery: 2,
		seaExpress: 3,
		sea: 4,
	};

	async getUnshippedPurchases() {
		return await Purchase.findUnshippedByProduct(this.product);
	}

	async getUndeliveredDeliveris() {
		return await Delivery.findUndeliveredByProduct(this.product);
	}

	static async updateAllSalesAndInventories() {
		let products = await Product.find();
		for (let product of products) {
			const updator = new ProductUpdator(product);
			await updator.updateSalesAndInventory();
		}
	}

	getSortedShipmentTypes() {
		return ShipmentType.sortByType(this.product.shipmentTypes);
	}

	async updateAll() {
		await this.updateUndeliveredDeliveris();
		await this.updateUnshippedPurchases();
		const { fbaInventory, sales } = await this.getFbaInventoryAndSalesV3();
		const { yisucangInventory, plwhsInventory } = await this.prepareWarehouseInvetories();
		const unshippedQty = await this.getUnshippedQty();
		const undeliveredQty = await this.getUndeliveredQty();
		const salesPeriod = await this.getSalesPeriod();
		const orderDues = await this.getOrderDues();
		const purchases = await this.getUnshippedPurchases();
		const shipments = await this.getShipments();
		const totalInventory = await this.getTotalInventory();
		const quantityToPurchase = await this.getQuantityToPurchase();
		const shipmentTypes = this.getSortedShipmentTypes();
		const newProduct = {
			fbaInventory,
			totalInventory,
			ps: sales,
			yisucangInventory,
			plwhsInventory,
			unshippedQty,
			undeliveredQty,
			salesPeriod,
			orderDues,
			shipments,
			quantityToPurchase,
			shipmentTypes,
			purchases,
		};

		this.product.set(newProduct);
		await this.product.save();
	}

	async getShipments() {
		const undeliveredDeliveris = await Delivery.findUndeliveredByProduct(this.product);
		let shipments = [];
		for (const delivery of undeliveredDeliveris) {
			const {
				code,
				expectArrivalDate,
				createdAt,
				memo,
				box,
				quantity,
				confirmShipmentDate,
				tracking,
				remainingArrivalDays,
			} = delivery;
			const shipment = {
				code,
				expectArrivalDate,
				createdAt,
				memo,
				box,
				quantity,
				confirmShipmentDate,
				tracking,
				remainingArrivalDays,
			};
			shipments.push(shipment);
		}
		return shipments;
	}

	async getQuantityToPurchase() {
		if (!this.product.unitsPerBox || this.product.unitsPerBox === 0) {
			this.product.unitsPerBox = 30;
		}

		const boxes = Math.ceil(
			(this.product.maxAvgSales * 90 - this.product.totalInventory) / this.product.unitsPerBox,
		);

		if (boxes > 0) {
			const quantity = boxes * this.product.unitsPerBox;
			return { boxes, quantity };
		} else {
			return { boxes: 0, quantity: 0 };
		}
	}

	async getTotalInventory() {
		return this.product.yisucangInventory + this.product.plwhsInventory + this.product.fbaInventory;
	}

	async getProducings() {
		const unshippedPurchases = await Purchase.findUnshippedByProduct(this.product);
		let producings = [];
		for (const purchase of unshippedPurchases) {
			const { unIndoundQuantity, code, expectDeliveryDate, createdAt } = purchase;
			const producing = { unIndoundQuantity, code, expectDeliveryDate, createdAt };
			producings.push(producing);
		}
		return producings;
	}

	async getOrderDues() {
		let orderDues = {};
		const { salesPeriod, cycle, minInventory } = this.product;
		for (const type of this.product.shipmentTypes) {
			const shipmentType = ShipmentTypesInfo[type];
			orderDues[type] = moment().add(
				salesPeriod - cycle - shipmentType.period - GAP - minInventory,
				"days",
			);
		}
		return orderDues;
	}

	async updateOrderDues() {
		const orderDues = await this.getOrderDues();
		this.product.set({ orderDues });
		await this.product.save();
	}

	async getSalesPeriod() {
		if (this.product.ps === 0) {
			return 1000000;
		}
		// const { fbaInventory, yisucangInventory, plwhsInventory, unshippedQty, undeliveredQty, ps } = this.product;
		// const stock = fbaInventory + yisucangInventory + plwhsInventory + unshippedQty + undeliveredQty;
		// return (stock / ps),
	}

	async getUndeliveredQty() {
		const undeliveredDeliveris = await this.getUndeliveredDeliveris();
		return undeliveredDeliveris.reduce((total, delivery) => {
			return total + delivery.quantity;
		}, 0);
	}

	async updateUnshippedPurchases() {
		let purchases = await this.getUnshippedPurchases();
		for (let purchase of purchases) {
			const purchaseUpdator = new PurchaseUpdator(purchase);
			await purchaseUpdator.updateAll(this.product);
		}
	}

	async updateUndeliveredDeliveris() {
		let deliveries = await this.getUndeliveredDeliveris();
		for (let delivery of deliveries) {
			const deliveryUpdator = new DeliveryUpdator(delivery);
			await deliveryUpdator.updateRemainingArrivalDays();
		}
	}

	async updateSalesPeriod() {
		const salesPeriod = await this.getSalesPeriod();
		this.product.set({ salesPeriod });
		await this.product.save();
	}

	async updateUndeliveredQty() {
		const undeliveredQty = await this.getUndeliveredQty();
		this.product.set({ undeliveredQty });
		await this.product.save();
	}

	async getUnshippedQty() {
		const unshippedPurchases = await this.getUnshippedPurchases();
		return unshippedPurchases.reduce((total, purchase) => {
			return total + purchase.quantity;
		}, 0);
	}

	async updateUnshippedQty() {
		const unshippedQty = await this.getUnshippedQty();
		this.product.set({ unshippedQty });
		await this.product.save();
	}

	async updateSalesAndFbaInventory() {
		const { fbaInventory, sales } = await this.getFbaInventoryAndSalesV3();
		this.product.set({ fbaInventory, sales });
		await this.product.save();
	}

	async getFbaInventoryAndSalesV3() {
		let fbaInventory = 0;
		let sales = 0;

		const listings = await Listing.findByProduct(this.product);
		for (const listing of listings) {
			fbaInventory =
				fbaInventory +
				listing.availableQuantity +
				listing.reservedFCTransfer +
				listing.inboundShipped +
				listing.reservedFCProcessing;

			sales = sales + listing.ps;
		}

		return {
			fbaInventory: Math.round(fbaInventory),
			sales: Math.round(sales),
		};
	}

	async updateWarehouseInventories() {
		const { yisucangInventory, plwhsInventory } = await prepareWarehouseInvetories();
		this.product.set({ yisucangInventory, plwhsInventory });
		await this.product.save();
	}

	async prepareWarehouseInvetories() {
		const yisucangInventory = await this.getYisucangInventory();
		const plwhsInventory = await this.getPlwhsInventory();
		return { yisucangInventory, plwhsInventory };
	}

	async getPlwhsInventory() {
		// TODO;
		let inventory = 0;
		return inventory;
	}

	async getYisucangInventory() {
		let inventory = 0;

		console.log("inventory", inventory);
		for (const yisucangId of this.product.yisucangId) {
			console.log("yisucangId", yisucangId);
			const yisucang = await Yisucang.findYisucangById(yisucangId);
			if (yisucang) {
				console.log(inventory);
				console.log(yisucang.inventory);
				inventory = inventory + yisucang.inventory;
				console.log(inventory);
			}
		}

		console.log(inventory);
		return inventory;
	}
}

module.exports = ProductUpdator;
