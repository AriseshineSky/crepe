const axios = require("axios");

async function getToken(url, auth) {
	return new Promise((resolve, reject) => {
		axios
			.post(url, auth)
			.then(function (res) {
				var token = {
					accessToken: res.data.data.accessToken,
					expiresIn: Date.now() / 1000 + res.data.data.expiresIn,
				};
				resolve(token);
			})
			.catch(function (error) {
				console.log(error);
				reject(error);
			});
	});
}
module.exports = {
	getToken,
};
