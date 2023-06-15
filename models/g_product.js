const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const GProductSchema = new Schema({
	pm: { type: Schema.Types.ObjectId, ref: "GUser" },
	fid: { type: String },
	auditStatusCode: { type: String },
	productName: { type: String },
	moq: { type: Number },
	purchaseUrl: { type: String },
	createdAt: { type: String },
	price: { type: String },
	invoiceType: { type: String },
	id: { type: String },
	auditStatusName: { type: String },
	quoteFlag: { type: String },
	productImageUrl: { type: String },
	quoteRemark: { type: String },
	includedTax: { type: String },
	supplierWarehouse: { type: String },
	productState: { type: String },
	invoiceTaxRate: { type: String },
	taxRebateRate: { type: String },
	taxRate: { type: String },
	gradientQuote: { type: String },
	creater: { type: String },
	includeTaxPrice: { type: String },
	attachmentIds: { type: String },
	syncDeliveryDays: { type: String },
	supplierGradientQuoteJson: { type: String },
	bucklePackage: { type: String },
	status: { type: String },
	invoiceTypeName: { type: String },
	editPage: { type: String },
	supplierNumber: { type: String },
	supplierCode: { type: String },
	includePackage: { type: String },
	buyerManagerId: { type: String },
	baseInfoRemark: { type: String },
	defaultSupplier: { type: String },
	supplierName: { type: String },
	product: { type: String },
	productStateName: { type: String },
	buyerManagerAccount: { type: String },
	deliveryDays: { type: String },
	buyerManager: { type: String },
	ountries: { type: [String] },
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

GProductSchema.plugin(BaseModel);

GProductSchema.pre("save", function (next) {
	const now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("GProduct", GProductSchema);
