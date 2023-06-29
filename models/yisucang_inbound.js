const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const YisucangInboundSchema = new Schema({
	number: { type: String },
	orderId: { type: String },
	boxCount: { type: Number, default: 0 },
	unitsPerBox: { type: Number, default: 0 },
	date: { type: Date, default: Date.now },
	createAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now },
	deletedAt: { type: Date },
});

YisucangInboundSchema.plugin(BaseModel);
YisucangInboundSchema.pre("save", function (next) {
	const now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("YisucangInbound", YisucangInboundSchema);
