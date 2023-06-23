var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var YisucangSchema = new Schema({
	yisucangId: { type: String },
	upc: { type: String },
	inventory: { type: Number, default: 0 },
	createAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now },
	deletedAt: { type: Date },
});

YisucangSchema.plugin(BaseModel);
YisucangSchema.pre("save", function (next) {
	var now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Yisucang", YisucangSchema);
