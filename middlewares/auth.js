const jwt = require("jsonwebtoken");
const User = require("../proxy").User;

function checkPermission() {
	return async (req, res, next) => {
		try {
			const rawToken = req.cookies.token;
			const tokenData = jwt.verify(rawToken, process.env.SECRET);
			const id = tokenData.id;
			const user = await User.findById(id);
			if (user) {
				req.user = user;
				next();
			} else {
				res.status(403).json({
					message: "Forbidden",
				});
			}
		} catch (error) {
			res.status(403).json({
				message: "Forbidden",
			});
		}
	};
}

module.exports = checkPermission;
