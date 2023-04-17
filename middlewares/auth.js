const jwt = require("jsonwebtoken");
const User = require("../proxy").User;
let Product = require("../proxy").Product;
function checkPermission() {
	return async (req, res, next) => {
		try {
			res.locals.message = {};
			res.locals.user = {};
			const rawToken = req.cookies.token;
			if (!rawToken) {
				res.redirect("/users/login");
				return;
			}
			let id = undefined;
			try {
				const tokenData = jwt.verify(rawToken, process.env.SECRET);
				id = tokenData.id;
			} catch (error) {
				res.redirect("/users/login");
				return;
			}
			const user = await User.findByObjId(id);
			if (user) {
				req.user = user;
				res.locals.user = user;
				const hasRole = user.roles.some((role) => role.name === "admin");
				if (hasRole) {
					next();
					return;
				}
				const productId = req.params.productId;
				if (productId) {
					const product = await Product.getProductById(productId);

					if (product.pm === id) {
						next();
					} else {
						throw Error("forbidden");
					}
				} else {
					next();
				}
			} else {
				console.log("can not find this user");
				res.redirect("/users/login");
			}
		} catch (error) {
			res.status(403).json({
				message: "Forbidden",
			});
		}
	};
}

module.exports = checkPermission;
