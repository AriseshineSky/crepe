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
	unreceivedBoxes: { type: Number },
	receivedBoxes: { type: Number },
	chargeWeight: { type: Number },
	estimatedAmount: { type: Number },
	receiveRnQuantity: { type: Number },
	quantity: { type: Number, default: 0 },
	actualAmount: { type: Number },
	code: { type: String },
	status: { type: String },
	statusName: { type: String },
	trackings: { type: String },
	transport: { type: String },
	transportMode: { type: String },
	transportName: { type: String },
	transportPrescription: { type: String },
	volumeWeightCoefficient: { type: String },
	orderId: { type: String },
	shipmentDate: { type: String },
	confirmShipmentDate: { type: Date },
	estimateArrivePortDate: { type: Date },
	expectShipmentDate: { type: Date },
	sailDate: { type: Date },
	actualArrivePortDate: { type: Date },
	actualAmountTime: { type: Date },
	actualArrivalDate: { type: Date },
	arrivalWarehouseId: { type: String },
	deliveryStatus: { type: String },
	packingCodeList: { type: String },
	channelId: { type: String },
	logisticsTrackingNumber: { type: String },
	chargeUnitPrice: { type: String },
	chargeWeight: { type: String },
	spiltTrackings: [{ type: String }],
	chargeWeightUnit: { type: String },
	containerType: { type: String },
	country: { type: String },
	updateTime: { type: Date },
	createdAt: { type: Date },
	expectShipmentDate: { type: Date },
	fbaWarehouse: { type: String },
	flCodeList: { type: String },
	importCompany: { type: String },
	importCompanyName: { type: String },
	createdTime: { type: Date },
	isShipment: { type: String },
	payer: { type: String },
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
