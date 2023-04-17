const User = require("../proxy").User;
var logger = require("../common/logger");
const jwt = require("jsonwebtoken");
const SECRET = "arsrstarstarstarst@ddw";
exports.create = async function (req, res, next) {
	res.render("index", { title: "regist" });
};

exports.showChangePassword = async (req, res, next) => {
	res.render("user/reset-password", {
		title: "Change Password",
		user: { name: null },
		message: "",
	});
};

exports.logout = async (req, res, next) => {
	res.cookie("token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;");
	res.redirect("/users/login");
};

exports.login = async function (req, res, next) {
	try {
		const { token, user } = await User.getToken({
			name: req.body.name,
			password: req.body.password,
		});
		console.log(token);
		res.cookie("token", token, { maxAge: 900000, httpOnly: true });
		req.flash("success", "Login Successfully");
		res.redirect("/products");
	} catch (error) {
		console.log("login error", error);
		req.flash("error", error);
		res.redirect("/users/login");
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
	res.render("user/login", { title: "login", user: { name: null } });
};

exports.changePassword = async (req, res, next) => {
	const oldPassword = req.body.oldPassword;
	const newPassword = req.body.newPassword;
	const name = req.body.name;
	try {
		const { token, user } = await User.changePassword({ name, oldPassword, newPassword });
		res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true });
		res.redirect("/products");
	} catch (error) {
		return res.status(422).send({
			message: error,
		});
	}
};
