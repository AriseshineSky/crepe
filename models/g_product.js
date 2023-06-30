const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const GProductSchema = new Schema({
	auditStatusCode: { type: String },
	moq: { type: String },
	purchaseUrl: { type: String },
	createdAt: { type: String },
	price: { type: String },
	invoiceType: { type: String },
	id: { type: String },
	auditStatusName: { type: String },
	quoteRemark: { type: String },
	includedTax: { type: String },
	supplierWarehouse: { type: String },
	invoiceTaxRate: { type: String },
	taxRebateRate: { type: String },
	taxRate: { type: String },
	gradientQuote: { type: String },
	creater: { type: String },
	includeTaxPrice: { type: String },
	supplierGradientQuoteJson: { type: String },
	bucklePackage: { type: String },
	status: { type: String },
	invoiceTypeName: { type: String },
	bindOpen1688: { type: String },
	supplierNumber: { type: String },
	supplierCode: { type: String },
	includePackage: { type: String },
	buyerManagerId: { type: String },
	baseInfoRemark: { type: String },
	defaultSupplier: { type: String },
	currency: { type: String },
	supplierName: { type: String },
	product: { type: String },
	productStateName: { type: String },
	deliveryDays: { type: String },
	taxPrice: { type: String },
	buyerManager: { type: String },
});

GProductSchema.plugin(BaseModel);

mongoose.model("GProduct", GProductSchema);
