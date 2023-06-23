const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const ShipmentTypeSchema = new Schema({
	name: { type: String },
	period: { type: Number },
});

ShipmentTypeSchema.plugin(BaseModel);
ShipmentTypeSchema.pre("save", function (next) {
	const now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("ShipmentType", ShipmentTypeSchema);
