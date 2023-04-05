const User = require("../proxy").User;
var logger = require("../common/logger");
const jwt = require("jsonwebtoken");
const SECRET = "arsrstarstarstarst@ddw";
exports.create = async function (req, res, next) {
	res.render("index", { title: "regist" });
};

exports.login = async function (req, res, next) {
	const user = await User.findOne({
		name: req.body.username,
	});
	if (!user) {
		return res.status(422).send({
			message: "user does not exist",
		});
	}
	const isPasswordValid = require("bcryptjs").compareSync(req.body.password, user.password);
	if (!isPasswordValid) {
		return res.status(422).send({
			message: "invalid password",
		});
	}
	const token = jwt.sign(
		{
			id: String(user._id),
		},
		SECRET,
	);

	res.send({
		user,
		token,
	});
};
exports.list = async function (req, res, next) {};
exports.create = async function (req, res, next) {
	try {
		await User.create({
			name: req.body.username,
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
	res.render("user/register", { title: "regist", messages: {} });
};
exports.showLogin = async function (req, res, next) {
	// res.render("user/login");
	res.render("login", { title: "login" });
};
