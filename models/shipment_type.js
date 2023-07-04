const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const ShipmentTypeSchema = new Schema({
	name: { type: String },
	type: {
		type: String,
		default: function () {
			return this.name;
		},
	},
	period: { type: Number, default: 0 },
	price: { type: Number, default: 0 },
});

ShipmentTypeSchema.plugin(BaseModel);

mongoose.model("ShipmentType", ShipmentTypeSchema);
