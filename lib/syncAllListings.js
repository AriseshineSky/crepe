const authes = require("../api/gerpgo/auth");
const GerpgoClient = require("../services/gerpgoClient");
const logger = require("../common/logger");
const Listing = require("../proxy").Listing;

async function getListings(gerpgoClient) {
	const url = open_apis.listings;
	let i = 1;
	let state = "begin";
	while (state !== "end") {
		console.log("get listings page: ", i);
		const data = {
			page: i,
			pagesize: 500,
		};

		const res = await gerpgoClient.fetchListings(url, data);
		if (res.data && res.data.rows.length > 0) {
			state = await parseListingRes(res.data);
		} else {
			break;
		}

		await wait(200);
		i++;
	}
}

async function parseListingRes(data) {
	if (data.rows.lenth > 0) {
		for (const listing of data.rows) {
			await Listing.createOrUpdate(listing);
		}
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
