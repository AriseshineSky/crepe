const fbaInventoryApi = require("../api/gerpgo/fbaInventory");
const authes = require("../api/gerpgo/auth");
const Token = require("../api/token");

const Listing = require("../proxy").Listing;
const logger = require("../common/logger");

function parseAccountCountry(warehouseName) {
	var country = warehouseName.split(":").pop().split("_")[0];
	var account = warehouseName.split(":")[0];
	return {
		country: country,
		account: account,
	};
}

async function saveListing(listing, data) {
	await Listing.createOrUpdate(listing, data);
}

async function syncListingsFromJijia(token, salt) {
	const url = `${gerpgo_api_prefix}` + `${open_apis.fbaInventory}`;
	let i = 1;
	let state = "begin";
	let listings = {};
	while (state !== "end") {
		console.log("get listings page: ", i);
		const data = {
			page: i,
			sort: "inventoryQuantity",
			order: "descend",
			pagesize: 200,
		};
		state = await getListingsByBatch(url, data, token, listings, salt);
		await wait(200);
		i++;
	}
	return listings;
}

async function getListingsByBatch(url, data, token, listings, salt) {
	var fbaInventoryData = await fbaInventoryApi(url, data, token, salt);
	if (fbaInventoryData.data.from > fbaInventoryData.data.total) {
		return "end";
	} else {
		for (let listing of fbaInventoryData.data.rows) {
			let data = parseAccountCountry(listing.warehouseName);
			await saveListing(listing, data);
		}
		return "pending";
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

module.exports.syncListings = async function () {
	for (let auth of authes) {
		let token = await Token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`, auth);
		await syncListingsFromJijia(token, auth.appKey);
		await wait(2000);
	}
};
