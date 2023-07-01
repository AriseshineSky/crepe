const models = require("../models");
const User = models.User;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var logger = require("../common/logger");

exports.getToken = async function (user) {
	const savedUser = await User.findOne({
		name: user.name,
	});
	if (!savedUser) {
		throw new Error("user does not exist");
	}
	console.log(user);
	console.log(savedUser);
	console.log(process.env.SECRET);
	const isPasswordValid = require("bcryptjs").compareSync(user.password, savedUser.password);
	if (!isPasswordValid) {
		throw new Error("invalid password");
	}
	const token = jwt.sign(
		{
			id: String(savedUser._id),
		},
		process.env.SECRET,
	);
	return { token, user: savedUser };
};
exports.changePassword = async (user) => {
	const savedUser = await User.findOne({
		name: user.name,
	});
	if (!savedUser) {
		throw new Error("user does not exist");
	}
	const isOldPasswordValid = bcrypt.compareSync(user.oldPassword, savedUser.password);
	if (!isOldPasswordValid) {
		throw new Error("invalid old password");
	}
	const newUser = await User.update({ password: user.newPassword });
	const token = jwt.sign(
		{
			id: String(newUser._id),
		},
		process.env.SECRET,
	);
	return { token, user: newUser };
};
exports.create = async function (user) {
	if (!user) {
		return null;
	}
	return await User.create({
		name: user.name,
		email: user.email,
		chatId: user.chat_id,
		password: user.password,
	});
};

exports.checkAdmin = async function () {
	let admin = await User.findOne({ name: "admin" });
	if (!admin) {
		await User.create({
			name: "admin",
			chatId: "",
			realm: "",
			password: "vine153!!",
			plwhsId: "",
		});
	} else {
		console.log(admin);
	}
};

exports.findOrCreate = async function (user) {
	if (!user) {
		return null;
	}
	var savedUser = await User.findOne({ name: user.name });
	if (savedUser) {
		await savedUser.update({
			name: user.name,
			chatId: user.chat_id,
			realm: user.realm,
			password: "vine153!!",
			plwhsId: user.id,
		});
		return savedUser;
	} else {
		return await User.create({
			name: user.name,
			chatId: user.chat_id,
			realm: user.realm,
			password: "vine153!!",
			plwhsId: user.id,
		});
	}
};

exports.findByPlwhsId = async function (id) {
	if (!id) {
		return null;
	}
	return await User.findOne({ plwhsId: id });
};

exports.findByObjId = async function (id) {
	if (!id) {
		return null;
	}
	return await User.findById(id);
};
exports.updateUser = async function (user) {
	var savedUser = await User.findOne({ name: user.name });
	if (savedUser) {
		savedUser.chatId = user.chat_id;
		await savedUser.save();
		return savedUser;
	} else {
		return await User.create({ name: user.name, chatId: user.chat_id });
	}
};
