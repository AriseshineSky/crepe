var mongoose = require("mongoose");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var TokenSchema = new Schema({
	token: { type: String },
});

TokenSchema.plugin(BaseModel);

mongoose.model("Token", TokenSchema);

