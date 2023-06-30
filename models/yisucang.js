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

mongoose.model("Yisucang", YisucangSchema);
