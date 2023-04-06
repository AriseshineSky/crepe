const User = require("../proxy").User;
var logger = require("../common/logger");
const jwt = require("jsonwebtoken");
const SECRET = "arsrstarstarstarst@ddw";
exports.create = async function (req, res, next) {
	res.render("index", { title: "regist" });
};

exports.login = async function (req, res, next) {
	try {
		const { token, user } = await User.getToken({
			name: req.body.name,
			password: req.body.password,
		});
		console.log(token);
		res.cookie("token", token);
		res.send({
			user,
			token,
		});
	} catch (error) {
		return res.status(422).send({
			message: error,
		});
	}
};
exports.list = async function (req, res, next) {};
exports.create = async function (req, res, next) {
	try {
		await User.create({
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
		});
		req.flash("success", "User created successfully");
		res.redirect("/users/login");
	} catch (err) {
		console.log(err);
		req.flash("error", err.message);
		res.redirect("/users/register");
	}
};
exports.showRegister = async function (req, res, next) {
	res.render("user/register", { title: "regist", message: "" });
};
exports.showLogin = async function (req, res, next) {
	// res.render("user/login");
	res.render("user/login", { title: "login" });
};
