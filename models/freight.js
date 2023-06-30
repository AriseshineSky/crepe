var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var FreightSchema = new Schema({
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
	weight: { type: Number },
	orderId: { type: String },
	shippedDate: { type: Date },
	deliveryDue: { type: Date },
	fba: { type: Boolean, default: false },
	box: {
		length: { type: Number, default: 0 },
		width: { type: Number, default: 0 },
		height: { type: Number, default: 0 },
		weight: { type: Number, default: 0 },
		units: { type: Number, default: 0 },
	},
	quantity: { type: Number },
	deliveryStatus: { type: String },
});

FreightSchema.plugin(BaseModel);
mongoose.model("Freight", FreightSchema);
