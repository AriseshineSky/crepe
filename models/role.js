const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const RoleSchema = new Schema({
	name: { type: String },
});
RoleSchema.plugin(BaseModel);

mongoose.model("Role", RoleSchema);
