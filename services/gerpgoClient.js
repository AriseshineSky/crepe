const axios = require("axios");
const md5 = require("md5");

class GerpgoClient {
	constructor(auth) {
		this.auth = auth;
		this.appId = auth.appId;
		this.appKey = auth.appKey;
		this.token = null;
	}

	async fetchPurchases(url, data, token) {
		try {
			const sign = md5(JSON.stringify(data) + this.appId);
			const response = await axios(options("POST", data, token, sign, url));
			return response.data;
		} catch (error) {
			console.error("Error fetching data from gerpgo:", error);
		}
	}

	options(method, data, token, sign, url) {
		return {
			method: method,
			headers: {
				"content-type": "application/json",
				accessToken: token.accessToken,
				sign: sign,
			},
			data: data,
			url,
		};
	}

	async fetchToken(url, auth) {
		try {
			const res = await axios.post(url, auth);
			const token = {
				accessToken: res.data.data.accessToken,
				expiresIn: Date.now() / 1000 + res.data.data.expiresIn,
			};
			return token;
		} catch (error) {
			console.log(error);
		}
	}
}

module.exports = GerpgoClient;
