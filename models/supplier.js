let mongoose = require("mongoose");
let BaseModel = require("./base_model");
let Schema = mongoose.Schema;
let SupplierSchema = new Schema({
	code: { type: String },
	description: { type: String },
	updateAt: { type: String },
	qqNumber: { type: String },
	paymentType: { type: String },
	phone1: { type: String },
	buyerManagerId: { type: String },
	createdAt: { type: String },
	updaterId: { type: String },
	paymentRuleCode: { type: String },
	contact: { type: String },
	paymentCycle: { type: String },
	state: { type: String },
	createrId: { type: String },
	addr: { type: String },
	email: { type: String },
	paymentDesc: { type: String },
	supplierWarehouse: { type: String },
	paymentRate: { type: String },
	paymentRuleDesc: { type: String },
	open1688IsMatch: { type: String },
	receiptInfo: { type: String },
	name: { type: String },
	creater: { type: String },
	faxNumber: { type: String },
	paymentDate: { type: String },
	buyerManager: { type: String },
});
SupplierSchema.plugin(BaseModel);
mongoose.model("Supplier", SupplierSchema);
