const mongoose = require("mongoose");
const config = require("../config");
// // const logger = require('../common/logger');
mongoose.connect(
	config.db,
	{
		// useCreateIndex: true,
		useNewUrlParser: true,
	},
	function (err) {
		if (err) {
			// logger.error('connect to %s error: ', config.db, err.message);
			process.exit(1);
		}
	},
);

require("./product");
require("./user");
require("./freight");
require("./token");
require("./listing");
require("./role");
require("./yisucang");
exports.Product = mongoose.model("Product");
exports.User = mongoose.model("User");
exports.Freight = mongoose.model("Freight");
exports.Token = mongoose.model("Token");
exports.Listing = mongoose.model("Listing");
exports.Role = mongoose.model("Role");
exports.Yisucang = mongoose.model("Yisucang");
