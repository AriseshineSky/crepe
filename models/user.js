const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const UserSchema = new Schema({
	roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
	name: { type: String },
	password: {
		type: String,
		set(val) {
			let salt = bcrypt.genSaltSync(10);
			let hash = bcrypt.hashSync(val, salt);
			return hash;
		},
	},
	chatId: { type: String },
	plwhsId: { type: Number },
});
UserSchema.plugin(BaseModel);

mongoose.model("User", UserSchema);
