const authes = require("../api/gerpgo/auth");
const GerpgoClient = require("../services/gerpgoClient");
const logger = require("../common/logger");
const Listing = require("../proxy").Listing;

async function getListings(gerpgoClient) {
	const url = open_apis.fbaInventory;

	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get listings page: ", i);
		const data = {
			page: i,
			pagesize: 500,
		};

		const res = await gerpgoClient.fetchListings(url, data);
		if (res.data && res.data.rows) {
			console.log(res.data.rows.length);
			state = await parseListingRes(res.data.rows);
			console.log(state);
		} else {
			break;
		}

		await wait(200);
		i++;
	}
}

async function parseListingRes(rows) {
	if (rows && rows.length > 0) {
		for (let listing of rows) {
			console.log(listing);
			await Listing.createOrUpdate(listing);
		}
		return "pending";
	} else {
		return "end";
	}
}

function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function syncListings() {
	for (let auth of authes) {
		const gerpgoClient = new GerpgoClient(auth);
		await getListings(gerpgoClient);
		await wait(200);
	}
}

module.exports = { syncListings };
