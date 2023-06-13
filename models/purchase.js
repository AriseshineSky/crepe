let mongoose = require("mongoose");
let BaseModel = require("./base_model");
let Schema = mongoose.Schema;
let PurchaseSchema = new Schema({
	id: {
		type: String,
		required: true,
	},
	productId: {
		type: Schema.Types.ObjectId,
		ref: "Product",
	},
	product: { type: String },
	productName: { type: String },
	sellerSku: { type: String },
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
	inboundDetailsVoList: { type: String },
	stock: { type: Number, default: 0 },
	createAt: { type: Date, default: Date.now() },
	updateAt: { type: Date, default: Date.now() },
	deletedAt: { type: Date },
});

PurchaseSchema.plugin(BaseModel);
PurchaseSchema.pre("save", function (next) {
	let now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Purchase", PurchaseSchema);
