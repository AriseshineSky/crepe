const jwt = require("jsonwebtoken");
const User = require("../proxy").User;
let Product = require("../proxy").Product;
function checkPermission() {
	return async (req, res, next) => {
		try {
			const rawToken = req.cookies.token;
			console.log(rawToken);
			if (!rawToken) {
				res.redirect("/users/login");
				return;
			}
			const tokenData = jwt.verify(rawToken, process.env.SECRET);
			const id = tokenData.id;
			const user = await User.findById(id);
			if (user) {
				req.user = user;
				res.locals.user = user;
				const productId = req.params.productId;
				if (productId) {
					const product = await Product.getProductById(productId);
					console.log(id, product.pm);

					if (product.pm === id) {
						next();
					} else {
						throw Error("forbidden");
					}
				} else {
					next();
				}
			} else {
				throw Error("forbidden");
			}
		} catch (error) {
			res.status(403).json({
				message: "Forbidden",
			});
		}
	};
}

module.exports = checkPermission;
