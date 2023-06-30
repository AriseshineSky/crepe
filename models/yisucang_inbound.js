const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const YisucangInboundSchema = new Schema({
	number: { type: String },
	orderId: { type: String },
	boxCount: { type: Number, default: 0 },
	quantity: { type: Number, default: 0 },
	unitsPerBox: { type: Number, default: 0 },
	date: { type: Date, default: Date.now },
	logisticsTrackingNumber: { type: String },
});

YisucangInboundSchema.plugin(BaseModel);

mongoose.model("YisucangInbound", YisucangInboundSchema);
