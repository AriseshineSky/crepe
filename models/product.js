const { ObjectId } = require("mongodb");
var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ProductSchema = new Schema({
	pm: { type: Schema.Types.ObjectId, ref: "User" },
	asin: { type: String },
	countries: {
		type: [String],
		default: ["US", "CA", "MX", "UK", "IT", "DE", "FR", "SP", "JP", "AU"],
	},
	shipmentTypes: { type: [String], default: ["airExpress", "seaExpress"] },
	cycle: { type: Number, default: 20 },
	gSku: { type: String },
	unitsPerBox: { type: Number, default: 1 },
	maxAvgSales: { type: Number, default: 0 },
	avgSales: { type: Number, default: 0 },
	sales: { type: Number, default: 0 },
	ps: { type: Number, default: 0 },
	totalInventory: { type: Number, default: 0 },
	quantityToPurchase: {
		boxes: { type: Number, default: 0 },
		quantity: { type: Number, default: 0 },
	},
	yisucangInventory: { type: Number, default: 0 },
	fbaInventory: { type: Number, default: 0 },
	plwhsInventory: { type: Number, default: 0 },
	purchase: { type: Number, default: 0 },
	minInventory: { type: Number, default: 7 },
	orderQuantity: { type: Number },
	orderDues: [
		{
			type: { type: String },
			due: { type: Date },
		},
	],
	box: {
		length: { type: Number, default: 0 },
		width: { type: Number, default: 0 },
		height: { type: Number, default: 0 },
		weight: { type: Number, default: 0 },
	},
	shipments: [
		{
			code: { type: String },
			expectArrivalDate: { type: Date },
			createdAt: { type: Date },
			memo: { type: String },
			box: { type: String },
			confirmShipmentDate: { type: Date },
			tracking: { type: String },
			remainingArrivalDays: { type: Number },
			quantity: { type: Number },
			fba: { type: Boolean, default: false },
		},
	],
	purchases: [
		{
			code: { type: String },
			unIndoundQuantity: { type: Number, default: 0 },
			expectDeliveryDate: { type: Date },
			expectDeliveryDays: { type: Date },
			createdAt: { type: Date },
		},
	],
	peak: {
		start: { type: Date },
		end: { type: Date },
		maxSales: { type: Number },
	},
	discontinue: { type: Boolean, default: false },
	plwhsId: { type: String },
	yisucangId: { type: [String] },
	plan: { type: String },
	tempPlan: { type: String },
	createAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now },
	deletedAt: { type: Date },
});

ProductSchema.plugin(BaseModel);

ProductSchema.pre("save", function (next) {
	var now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Product", ProductSchema);
