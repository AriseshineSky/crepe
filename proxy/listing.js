const models = require("../models");
const Listing = models.Listing;
const logger = require("../common/logger");

exports.findLisingsByAsin = async function (asin) {
	return await Listing.find({ asin: asin });
};

async function findByProduct(product) {
	const countries = product.countries.map((country) => {
		return country.toUpperCase();
	});
	let weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	return await Listing.find({
		asin: product.asin,
		country: { $in: countries },
		updateAt: { $gte: weekAgo.toISOString() },
	});
}

async function createOrUpdate(listing) {
	const [account, country] = listing.marketName.split(":");

	const { asin, fnsku } = listing;
	let savedlisting = await Listing.findOne({
		asin,
		country,
		fnsku,
		account,
	});

	if (savedlisting) {
		savedlisting = { ...savedlisting, ...listing };
		return await savedlisting.save();
	} else {
		return await Listing.create({
			asin,
			country,
			fnsku,
			account,
		});
	}
}

exports.findOrCreate = async function (listing, data) {
	const savedlisting = await Listing.findOne({
		asin: listing.asin,
		country: data.country,
		fnsku: listing.fnsku,
		account: data.account,
	});
	if (savedlisting) {
		savedlisting.availableQuantity = listing.availableQuantity;
		savedlisting.reservedFCTransfer = listing.reservedFCTransfer;
		savedlisting.reservedFCProcessing = listing.reservedFCProcessing;
		savedlisting.inboundShipped = listing.inboundShipped;
		savedlisting.ps = listing.ps;
		await savedlisting.save();
		return savedlisting;
	} else {
		return await Listing.create({
			asin: listing.asin,
			country: data.country,
			fnsku: listing.fnsku,
			account: data.account,
		});
	}
};

exports.update = async function (listing, newListing) {
	listing.availableQuantity = newListing.availableQuantity;
	listing.reservedFCTransfer = newListing.reservedFCTransfer;
	listing.reservedFCProcessing = newListing.reservedFCProcessing;
	listing.inboundShipped = newListing.inboundShipped;
	listing.ps = newListing.ps;
	listing.save(function (error) {
		if (error) {
			logger.error(error);
		}
	});
};

module.exports = {
	find: Listing.find.bind(Listing),
	findByProduct,
	createOrUpdate,
};
