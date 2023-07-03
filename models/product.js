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
		boxCount: { type: Number, default: 0 },
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
			purchaseCode: { type: String },
			code: { type: String },
			expectArrivalDate: { type: Date, default: Date.now() },
			createdAt: { type: Date, default: Date.now() },
			memo: { type: String },
			box: { type: String },
			confirmShipmentDate: { type: Date, default: Date.now() },
			tracking: { type: String },
			remainingArrivalDays: { type: Number },
			quantity: { type: Number, default: 0 },
			fba: { type: Boolean, default: false },
		},
	],
	purchases: [
		{
			code: { type: String },
			orderId: { type: String },
			shippedQuantity: { type: Number, default: 0 },
			unshippedQuantity: { type: Number, default: 0 },
			unIndoundQuantity: { type: Number, default: 0 },
			totalQuantity: { type: Number, default: 0 },
			boxes: { type: Number, default: 0 },
			expectDeliveryDate: { type: Date, default: Date.now() },
			expectDeliveryDays: { type: Number, default: 0 },
			createdAt: { type: Date, default: Date.now() },
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
});

ProductSchema.plugin(BaseModel);

mongoose.model("Product", ProductSchema);
