const path = require("path");
var baseApi = require("./base");
var listings = {};

function parseAccountCountry(warehouseName) {
	return new Promise((resolve, reject) => {
		var country = warehouseName.split(":").pop().split("_")[0];
		var account = warehouseName.split(":")[0];
		resolve({
			country: country,
			account: account,
		});
	});
}

function parseListing(listing) {
	parseAccountCountry(listing.warehouseName).then((data) => {
		if (listings.hasOwnProperty(listing.asin)) {
			if (listings[listing.asin].hasOwnProperty(data.country)) {
				if (listings[listing.asin][data.country].hasOwnProperty(data.account)) {
					listings[listing.asin][data.country][data.account].push(listingObject(listing));
				} else {
					listings[listing.asin][data.country][data.account] = [listingObject(listing)];
				}
			} else {
				listings[listing.asin][data.country] = { [data.account]: [listingObject(listing)] };
			}
		} else {
			listings[listing.asin] = {
				[data.country]: { [data.account]: [listingObject(listing)] },
			};
		}
	});
}

function parseInventoryInfo(data) {
	return new Promise((resolve, reject) => {
		console.log("total", data.data.total);
		console.log("from", data.data.from);
		if (data.data && data.data.total < data.data.from) {
			// if (data.data && (100 < data.data.from)) {
			resolve(listings);
			return;
		}
		var inventorys = data.data.rows;

		if (inventorys) {
			inventorys.forEach(function (inventory) {
				parseListing(inventory);
			});
			resolve("success");
		}
	});
}

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
