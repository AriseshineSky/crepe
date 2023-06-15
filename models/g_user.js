const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const BaseModel = require("./base_model");
const Schema = mongoose.Schema;
const GUserSchema = new Schema({
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
GUserSchema.plugin(BaseModel);
GUserSchema.pre("save", function (next) {
	const now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("User", GUserSchema);
