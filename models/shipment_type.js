const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const ShipmentTypeSchema = new Schema({
	name: { type: String },
	period: { type: Number },
});

ShipmentTypeSchema.plugin(BaseModel);

mongoose.model("ShipmentType", ShipmentTypeSchema);
