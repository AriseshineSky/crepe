const models = require("../models");
const User = models.User;
const jwt = require("jsonwebtoken");
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
exports.findOrCreate = async function (user) {
	if (!user) {
		return null;
	}
	var savedUser = await User.findOne({ name: user.username });
	if (savedUser) {
		return await savedUser.update({
			name: user.username,
			chatId: user.chat_id,
			realm: user.realm,
			password: "vine153!!",
		});
		return savedUser;
	} else {
		return await User.create({
			name: user.username,
			chatId: user.chat_id,
			realm: user.realm,
			password: "vine153!!",
		});
	}
};

exports.findById = async function (id) {
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
