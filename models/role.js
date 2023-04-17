const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const RoleSchema = new Schema({
	name: { type: String },
});
RoleSchema.plugin(BaseModel);
RoleSchema.pre("save", function (next) {
	const now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("Role", RoleSchema);
