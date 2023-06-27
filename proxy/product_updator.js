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

class ProductUpdator {
	constructor(product) {
		this.product = product;
	}

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
		const { yisucangInventory, plwhsInventory } = await prepareWarehouseInvetories();
		const unshippedQty = await this.getUnshippedQty();
		const undeliveredQty = await this.getUndeliveredQty();
		const salesPeriod = await this.getSalesPeriod();
		const orderDues = await this.getOrderDues();
		const producings = await this.getProducings();
		const shipments = await this.getShipments();
		const totalInventory = await this.getTotalInventory();
		const quantityToPurchase = await this.getQuantityToPurchase();
		const shipmentTypes = await this.getSortedShipmentTypes();
		const newProduct = {
			fbaInventory,
			totalInventory,
			sales,
			yisucangInventory,
			plwhsInventory,
			unshippedQty,
			undeliveredQty,
			salesPeriod,
			orderDues,
			producings,
			shipments,
			quantityToPurchase,
			shipmentTypes,
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
			shipments.append(shipment);
		}
		return shipments;
	}

	async getQuantityToPurchase() {
		if (this.product.unitsPerBox === 0) {
			this.product.unitsPerBox = 30;
		}

		const boxes = Math.ceil(
			(this.product.maxAvgSales * 90 - this.product.totalInventory) / this.product.unitsPerBox,
		);

		if (boxes > 0) {
			const quantity = boxes * this.product.unitsPerBox;
			return { boxes: boxes, quantity: quantity };
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
			producings.append(producing);
		}
		return producings;
	}

	async getOrderDues() {
		let orderDues = {};
		const { salesPeriod, cycle, minInventory } = this.product;
		for (const type of this.product.shipmentTypes) {
			const shipmentType = await ShipmentType.findOne({ name: type });
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
		await this.getUndeliveredDeliveris();
		return this.undeliveredDeliveris.reduce((total, delivery) => {
			return total + delivery.quantity;
		}, 0);
	}

	async updateUnshippedPurchases() {
		let purchases = await this.getUnshippedPurchases();
		for (let purchase of purchases) {
			const purchaseUpdator = new PurchaseUpdator(purchase);
			await purchaseUpdator.updateRemainingDeliveryDays();
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
		await this.getUnshippedPurchases();
		return (unshippedQty = this.unshippedPurchases.reduce((total, purchase) => {
			return total + purchase.quantity;
		}, 0));
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
			fbaInventory,
			sales,
		};
	}

	async updateWarehouseInventories() {
		const { yisucangInventory, plwhsInventory } = await prepareWarehouseInvetories();
		this.product.set({ yisucangInventory, plwhsInventory });
		await this.product.save();
	}

	async prepareWarehouseInvetories() {
		const yisucangInventory = await getYisucangInventory();
		const plwhsInventory = await getPlwhsByProduct();
		return { yisucangInventory, plwhsInventory };
	}

	async getYisucangInventory() {
		let inventory = 0;
		for (const yisucangId of this.product.yisucangIds) {
			const yisucang = await Yisucang.findYisucangById(yisucangId);
			if (yisucang) {
				inventory += yisucang.stock;
			}
		}
		return inventory;
	}
}

module.exports = ProductUpdator;
