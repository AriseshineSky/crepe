const axios = require("axios");
const md5 = require("md5");

class GerpgoClient {
	constructor(auth) {
		this.domain = auth.domain;
		this.appId = auth.appId;
		this.appKey = auth.appKey;
		this.token = null;
	}

	async fetchPurchases(url, data) {
		try {
			await this.ensureToken();
			const sign = md5(JSON.stringify(data) + this.appId);
			const response = await axios(options("POST", data, sign, url));
			return response.data;
		} catch (error) {
			console.error("Error fetching data from gerpgo:", error);
		}
	}

	options(method, data, sign, url) {
		return {
			method: method,
			headers: {
				"content-type": "application/json",
				accessToken: this.token.accessToken,
				sign: sign,
			},
			data: data,
			url,
		};
	}

	async ensureToken() {
		if (this.token === null) {
			await this.fetchToken();
		}
	}

	async fetchToken() {
		try {
			const url = `https://${this.domain}/api/open/api_token`;
			const auth = { appId: this.appId, appKey: this.appKey };
			const res = await axios.post(url, auth);
			this.token = {
				accessToken: res.data.data.accessToken,
				expiresIn: Date.now() / 1000 + res.data.data.expiresIn,
			};
			return this.token;
		} catch (error) {
			console.log(error);
		}
	}
}

module.exports = GerpgoClient;
