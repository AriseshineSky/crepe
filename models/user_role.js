const mongoose = require("mongoose");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const UserRoleSchema = new Schema({
	role: { type: Schema.Types.String, index: true, require: true },
	roleData: Schema.Types.Mixed,
});
UserRoleSchema.plugin(BaseModel);
UserRoleSchema.pre("save", function (next) {
	const now = new Date();
	this.updateAt = now;
	next();
});

const AdminSchema = new Schema({ adminProp: String }, { _id: false });
mongoose.model("User", UserSchema);
