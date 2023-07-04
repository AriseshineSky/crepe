const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const DeliverySchema = new Schema({
	product: {
		type: Schema.Types.ObjectId,
		ref: "Product",
	},
	purchase: {
		type: Schema.Types.ObjectId,
		ref: "Purchase",
	},
	memo: { type: String },
	purchaseCode: { type: String },
	box: { type: Number },
	totalBoxes: { type: Number },
	unreceivedQuantity: {
		type: Number,
		default: function () {
			return this.quantity;
		},
	},
	receivedQuantity: { type: Number, default: 0 },
	unreceivedBoxes: {
		type: Number,
		default: function () {
			return this.box;
		},
	},
	receivedBoxes: { type: Number, default: 0 },
	chargeWeight: { type: Number },
	estimatedAmount: { type: Number },
	receiveRnQuantity: { type: Number },
	quantity: { type: Number, default: 0 },
	actualAmount: { type: Number },
	code: { type: String },
	status: { type: String },
	statusName: { type: String },
	trackings: { type: String },
	orderId: { type: String },
	shipmentDate: { type: Date },
	confirmShipmentDate: { type: Date },
	estimateArrivePortDate: { type: Date },
	expectShipmentDate: { type: Date },
	sailDate: { type: Date },
	actualArrivalDate: { type: Date },
	deliveryStatus: { type: String },
	logisticsTrackingNumber: { type: String },
	spiltTrackings: [{ type: String }],
	isShipment: { type: String },
	receiptDate: { type: Date },
	receivingAt: { type: Date },
	receiptQuantity: { type: String },
	diffQuantity: { type: String },
	supplierCode: { type: String },
	expectArrivalDate: { type: Date },
	remainingArrivalDays: { type: Number },
});

DeliverySchema.plugin(BaseModel);

mongoose.model("Delivery", DeliverySchema);
