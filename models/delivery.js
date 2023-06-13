var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var DeliverySchema = new Schema({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	product: {
		type: Schema.Types.ObjectId,
		ref: "Product",
	},
	purchase: {
		type: Schema.Types.ObjectId,
		ref: "Purchase",
	},
	memo: { type: String },
	box: { type: Number },
	chargeWeight: { type: Number },
	code: { type: Number },
	estimatedAmount: { type: Number },
	quantity: { type: Number },
	receiptQuantity: { type: Number },
	actualAmount: { type: Number },
	code: { type: String },
	status: { type: String },
	statusName: { type: String },
	trackings: { type: String },
	transport: { type: String },
	transportMode: { type: String },
	transportPrescription: { type: String },
	volumeWeightCoefficient: { type: String },
	orderId: { type: String },
	shipmentDate: { type: Date },
	confirmShipmentDate: { type: Date },
	estimateArrivePortDate: { type: Date },
	expectShipmentDate: { type: Date },
	sailDate: { type: Date },
	actualArrivePortDate: { type: Date },
	actualAmountTime: { type: Date },
	actualArrivalDate: { type: Date },
	fbaWarehouse: { type: Boolean, default: false },
	deliveryStatus: { type: String },
	createAt: { type: Date, default: Date.now() },
	updateAt: { type: Date, default: Date.now() },
	deletedAt: { type: Date },
});

DeliverySchema.plugin(BaseModel);
DeliverySchema.pre("save", function (next) {
	var now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Delivery", DeliverySchema);
