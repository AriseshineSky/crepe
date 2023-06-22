const { ObjectId } = require("mongodb");
var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ProductSchema = new Schema({
	pm: { type: Schema.Types.ObjectId, ref: "User" },
	asin: { type: String },
	countries: { type: [String], default: ["US", "CA"] },
	shipmentTypes: { type: [String], default: ["airExpress", "seaExpress"] },
	cycle: { type: Number, default: 20 },
	gSku: { type: String },
	unitsPerBox: { type: Number, default: 1 },
	maxAvgSales: { type: Number, default: 0 },
	avgSales: { type: Number },
	ps: { type: Number, default: 0 },
	stock: { type: Number, default: 0 },
	fbaInventory: { type: Number },
	plwhs: { type: Number, default: 0 },
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
	inboundShippeds: [
		{
			orderId: { type: String },
			quantity: { type: Number },
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
		},
	],
	purchases: [{ type: Schema.Types.ObjectId, ref: "Purchase" }],
	producings: [
		{
			orderId: { type: String },
			quantity: { type: Number, default: 0 },
			deliveryDue: { type: Date },
			created: { type: Date },
			shipped: { type: Boolean },
			inboundShippeds: [
				{
					orderId: { type: String },
					quantity: { type: Number },
					shippedDate: { type: Date },
					deliveryDue: { type: Date },
					box: {
						length: { type: Number, default: 0 },
						width: { type: Number, default: 0 },
						height: { type: Number, default: 0 },
						weight: { type: Number, default: 0 },
						units: { type: Number, default: 0 },
					},
				},
			],
			deleted: { type: Boolean, default: false },
			deletedAt: { type: Date },
		},
	],
	peak: {
		start: { type: Date },
		end: { type: Date },
		maxSales: { type: Number },
	},
	airDelivery: { type: Boolean, default: false },
	discontinue: { type: Boolean, default: false },
	sea: { type: Boolean, default: false },
	plwhsId: { type: Number, default: 0 },
	yisucangId: { type: [String] },
	plan: { type: String },
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
