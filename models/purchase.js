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
	parentTotalQuantity: { type: String },
	reviewerId: { type: String },
	totalPackages: { type: String },
	memo: { type: String },
	businessOrderStatus: { type: String },
	productName: { type: String },
	childInboundQuantity: { type: String },
	businessCode: { type: String },
	totalQuantity: { type: String },
	purchaseOtherFee: { type: String },
	businessOrderOrigin: { type: String },
	uninboundAmount: { type: String },
	reduceQuantity: { type: String },
	id: { type: String },
	invoicesStatusName: { type: String },
	taxFlag: { type: String },
	invoicesStatus: { type: String },
	unInboundQuantity: { type: String },
	paymentRate: { type: String },
	undeliveredAmount: { type: String },
	terminatedMemo: { type: String },
	supervisorId: { type: String },
	transferWarehouseId: { type: String },
	paymentStatusStr: { type: String },
	childTotalQuantity: { type: String },
	deliveryStatus: { type: String },
	actualPrice: { type: String },
	reduceMemo: { type: String },
	supplierNumber: { type: String },
	relevancePoCodeList: [{ type: String }],
	supplierCode: { type: String },
	paymentType: { type: String },
	customCode: { type: String },
	products: [
		{
			productImageUrl: { type: String },
			quantity: { type: String },
		},
	],
	businessOrderStatusName: { type: String },
	arrivalMarketName: { type: String },
	orderTotalAmount: { type: String },
	procurementMethod: { type: String },
	paymentCycle: { type: String },
	currency: { type: String },
	purchasePlanCode: { type: String },
	arrivalMarketId: { type: String },
	urgent: { type: String },
	skuSpecies: { type: String },
	transferWarehouseName: { type: String },
	creator: { type: String },
	actualAmount: { type: String },
	updateTime: { type: String },
	appliedAmount: { type: String },
	reviewer: { type: String },
	arrivalWarehouseName: { type: String },
	createTime: { type: String },
	childActualQuantity: { type: String },
	transportName: { type: String },
	createdAt: { type: String },
	isBack: { type: String },
	exchangeRate: { type: String },
	actualQuantity: { type: String },
	paymentRuleCode: { type: String },
	ordeQuantity: { type: String },
	paymentDesc: { type: String },
	reviewTime: { type: String },
	creatorId: { type: String },
	paymentAmount: { type: String },
	purchaseType: { type: String },
	lotNoCode: { type: String },
	unActualQuantity: { type: String },
	paymentRuleVersion: { type: String },
	increaseQuantity: { type: String },
	sellerSku: { type: String },
	productType: { type: String },
	paymentStatus: { type: String },
	supplierName: { type: String },
	procurementMethodName: { type: String },
	procureItemVoList: { type: String },
	parentActualQuantity: { type: String },
	changeReason: { type: String },
	assembleSkuOrder: { type: String },
	arrivalWarehouseIdList: [{ type: String }],
	plCreator: { type: String },
	purchaseTypeName: { type: String },
	paymentTypeName: { type: String },
	totalAfterTaxRebateAmount: { type: String },
	excludeTaxAmount: { type: String },
	transport: { type: String },
	purchaseAmount: { type: String },
	deliveryStatusName: { type: String },
	srmWorkflowDTO: { type: String },
	purchaseSubjectId: { type: String },
	delayExpectDeliveryDate: { type: String },
	relevancePoCodeListStr: { type: String },
	asin: { type: String },
	parentInboundQuantity: { type: String },
	paymentDate: { type: String },
	totalPackageWeight: { type: String },
	packageWeight: { type: String },
	balanceQuantity: { type: String },
	volumeWeight: { type: String },
	productName: { type: String },
	orderQuantity: { type: String },
	brand: { type: String },
	unInboundQuantity: { type: String },
	packages: { type: String },
	isFbaWarehouse: { type: String },
	totalActualAmount: { type: String },
	arrivalMarketName: { type: String },
	currency: { type: String },
	arrivalMarketId: { type: String },
	product: { type: String },
	planQuantity: { type: String },
	excludeTaxPrice: { type: String },
	actualQuantity: { type: String },
	isDelayDelivery: { type: String },
	productTypeName: { type: String },
	invoiceType: { type: String },
	productImageUrl: { type: String },
	arrivalWarehouseId: { type: String },
	expectDeliveryDate: { type: String },
	expectDeliveryDays: { type: Number, default: 0 },
	inboundQuantity: { type: String },
	totalExcludeTaxAmount: { type: String },
	totalAmount: { type: String },
	unit: { type: String },
	planExpectDeliveryDate: { type: String },
	assemblyJson: { type: String },
	productType: { type: String },
	specification: { type: String },
	delayExpectDeliveryDate: { type: String },
	totalExcludeTax: { type: String },
	category: { type: String },
	totalPackageWeight: { type: String },
	procureItemVos: [
		{
			packageWeight: { type: String },
			balanceQuantity: { type: String },
			volumeWeight: { type: String },
			productName: { type: String },
			orderQuantity: { type: String },
			brand: { type: String },
			unInboundQuantity: { type: String },
			packages: { type: String },
			isFbaWarehouse: { type: String },
			totalActualAmount: { type: String },
			arrivalMarketName: { type: String },
			currency: { type: String },
			arrivalMarketId: { type: String },
			product: { type: String },
			planQuantity: { type: String },
			excludeTaxPrice: { type: String },
			actualQuantity: { type: String },
			isDelayDelivery: { type: String },
			productTypeName: { type: String },
			invoiceType: { type: String },
			productImageUrl: { type: String },
			arrivalWarehouseId: { type: String },
			expectDeliveryDate: { type: String },
			inboundQuantity: { type: String },
			totalExcludeTaxAmount: { type: String },
			totalAmount: { type: String },
			unit: { type: String },
			planExpectDeliveryDate: { type: String },
			assemblyJson: { type: String },
			productType: { type: String },
			specification: { type: String },
			delayExpectDeliveryDate: { type: String },
			totalExcludeTax: { type: String },
			category: { type: String },
			totalPackageWeight: { type: String },
		},
	],
});

PurchaseSchema.plugin(BaseModel);
PurchaseSchema.pre("save", function (next) {
	let now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Purchase", PurchaseSchema);
