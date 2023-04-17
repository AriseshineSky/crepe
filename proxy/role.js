const models = require("../models");
const Role = models.Role;
const User = models.User;

exports.init = async function () {
	let adminRole = await Role.findOne({
		name: "admin",
	});
	if (!adminRole) {
		adminRole = await Role.create({ name: "admin" });
	}
	const teamLeaderRole = await Role.findOne({
		name: "team-leader",
	});
	if (!teamLeaderRole) {
		Role.create({ name: "team-leader" });
	}
	let adminUser = await User.findOne({
		name: "admin",
	});
	if (!adminUser) {
		adminUser = await User.create({
			name: "admin",
			password: "admin153!!",
		});
	}
	const hasRole = adminUser.roles.some((roleId) => roleId.toString() === adminRole._id);
	if (!hasRole) {
		adminUser.roles.push(adminRole._id);
		adminUser.save();
	}
};
