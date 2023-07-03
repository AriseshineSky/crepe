let mongoose = require("mongoose");
let BaseModel = require("./base_model");
let Schema = mongoose.Schema;
let PurchaseSchema = new Schema({
	product: { type: String },
	productName: { type: String },
	sellerSku: { type: String },
	memo: { type: String },
	totalQuantity: { type: Number, default: 0 },
	boxCount: { type: Number, default: 0 },
	shippedQuantity: { type: Number, default: 0 },
	unshippedQuantity: {
		type: Number,
		default: function () {
			return this.totalQuantity;
		},
	},
	customCode: { type: String },
	orderTotalAmount: { type: Number, default: 0 },
	updateTime: { type: Date },
	createTime: { type: Date },
	yisucangId: { type: String },
	upc: { type: String },
	asin: { type: String },
	code: { type: String },
	deliveryStatus: { type: String },
	fnsku: { type: String },
	inboundQuantity: { type: String },
	orderQuantity: { type: String },
	actualQuantity: { type: String },
	actualPrice: { type: String },
	reduceMemo: { type: String },
	supplierNumber: { type: String },
	relevancePoCodeList: [{ type: String }],
	supplierCode: { type: String },
	paymentType: { type: String },
	products: [
		{
			productImageUrl: { type: String },
			quantity: { type: String },
		},
	],
	creator: { type: String },
	updateTime: { type: String },
	arrivalWarehouseName: { type: String },
	createTime: { type: String },
	childActualQuantity: { type: String },
	createdAt: { type: String },
	ordeQuantity: { type: String },
	paymentAmount: { type: String },
	increaseQuantity: { type: String },
	paymentStatus: { type: String },
	expectDeliveryDate: { type: String },
	expectDeliveryDays: { type: Number, default: 0 },
	totalExcludeTaxAmount: { type: String },
	totalAmount: { type: String },
	unit: { type: String },
	planExpectDeliveryDate: { type: String },
	totalPackageWeight: { type: String },
	deliveries: [
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
});

PurchaseSchema.plugin(BaseModel);

mongoose.model("Purchase", PurchaseSchema);
