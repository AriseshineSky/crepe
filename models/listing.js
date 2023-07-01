var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ListingSchema = new Schema({
	asin: { type: String },
	country: { type: String },
	fnsku: { type: String },
	account: { type: String },
	availableQuantity: { type: Number, default: 0 },
	reservedFCTransfer: { type: Number, default: 0 },
	reservedFCProcessing: { type: Number, default: 0 },
	inboundShipped: { type: Number, default: 0 },
	ps: { type: Number, default: 0 },
	avgSevenPs: { type: Number, default: 0 },
});

ListingSchema.plugin(BaseModel);

mongoose.model("Listing", ListingSchema);
