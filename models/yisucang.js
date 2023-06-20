var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var YisucangSchema = new Schema({
	yisucangId: { type: String },
	upc: { type: String },
	stock: { type: Number, default: 0 },
});

YisucangSchema.plugin(BaseModel);

mongoose.model("Yisucang", YisucangSchema);
