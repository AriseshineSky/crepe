const axios = require("axios");
var getToken = function (url) {
	return new Promise((resolve, reject) => {
		axios
			.post(url, {
				appId: "736aa3abfbfd4a7d854302ead8d5df06",
				appKey: "62daace5e4b073604b7e0b27",
			})
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
};
var getToken2 = function (url) {
	return new Promise((resolve, reject) => {
		axios
			.post(url, {
				appId: "3e0f7d42936a4343b3ad05d1239524ca",
				appKey: "6399d977e4b086e9ac8877e0",
			})
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
};
var getToken3 = function (url) {
	return new Promise((resolve, reject) => {
		axios
			.post(url, {
				appId: "a7939dad4f54403f85d608548a3a1113",
				appKey: "6419b1fbe4b07fc573e5ec7e",
			})
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
};
module.exports = {
	getToken,
	getToken2,
	getToken3,
};

