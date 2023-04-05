var mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var UserSchema = new Schema({
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
});
UserSchema.plugin(BaseModel);
UserSchema.pre("save", function (next) {
	var now = new Date();
	this.updateAt = now;
	next();
});

mongoose.model("User", UserSchema);

