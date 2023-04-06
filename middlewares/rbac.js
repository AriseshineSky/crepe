import { RBAC } from "rbac";
const rbac = new RBAC({
	roles: ["guest", "user", "admin"],
	permissions: {
		guest: ["home-page"],
		user: ["user-page"],
		admin: ["admin-page"],
	},
	grants: {
		guest: ["user"],
		user: ["admin"],
	},
});

module.exports = rbac;
