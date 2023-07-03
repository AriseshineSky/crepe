var path = require("path");

var config = {
	log_dir: path.join(__dirname, "logs"),
	debug: true,
};

config.db = "mongodb://127.0.0.1:27017/crepe";
// config.db = "mongodb://mongodb:27017/crepe";
SECRET = "fdfhfjdfdjfdjerwrereresaassa2dd@ddds";
module.exports = config;
