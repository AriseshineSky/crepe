var baseApi = require("./base");
module.exports = function (url, data, token, salt) {
	return new Promise((resolve, reject) => {
		baseApi(url, data, token, salt).then(
			function (data) {
				resolve(data);
			},
			function (error) {
				reject(error);
			},
		);
	});
};
