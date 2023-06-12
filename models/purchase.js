var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var PurchaseSchema = new Schema({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	productId: {
		type: Schema.Types.ObjectId,
		ref: "Product",
	},
	product: { type: String },
	memo: { type: String },
	totalQuantity: { type: Number },
	unInboundQuantity: { type: Number },
	supervisorId: { type: Number },
	supplierCode: { type: String },
	customCode: { type: String },
	orderTotalAmount: { type: Number },
	updateTime: { type: Date },
	createTime: { type: Date },
	yisucangId: { type: String },
	upc: { type: String },
	asin: { type: String },
	code: { type: String },
	deliveryStatur: { type: String },
	fnsku: { type: String },
	inboundQuantity: { type: String },
	orderQuantity: { type: String },
	actualQuantity: { type: String },
	stock: { type: Number, default: 0 },
	createAt: { type: Date, default: Date.now() },
	updateAt: { type: Date, default: Date.now() },
	deletedAt: { type: Date },
});

PurchaseSchema.plugin(BaseModel);
PurchaseSchema.pre("save", function (next) {
	var now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Purchase", PurchaseSchema);
