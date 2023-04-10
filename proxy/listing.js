var models  = require('../models');
var Listing = models.Listing;
var logger = require('../common/logger');

exports.findAll = async function() {
  return await Listing.find({});
}

exports.findLisingsByAsin = async function(asin) {
  return await Listing.find({"asin": asin});
}

exports.findLisingsByProduct = async function(product) {
  const countries = product.countries.map((country) => { return country.toUpperCase() });
  return await Listing.find({"asin": product.asin, 'country': { $in: countries }});
}

exports.findOrCreate = async function(listing, data) {
  var savedlisting = await Listing.findOne({"asin": listing.asin, "country": data.country, "fnsku": listing.fnsku, "account": data.account});
  if (savedlisting) {
    return savedlisting;
  } else {
    return await Listing.create({"asin": listing.asin, "country": data.country, "fnsku": listing.fnsku, "account": data.account});
  }
}

exports.update = async function(listing, newListing) {
  listing.availableQuantity = newListing.availableQuantity;
  listing.reservedFCTransfer = newListing.reservedFCTransfer;
  listing.reservedFCProcessing = newListing.reservedFCProcessing;
  listing.inboundShipped = newListing.inboundShipped;
  listing.ps = newListing.ps;
  listing.save(function(error) {
    if (error) {
      logger.error(error);
    }
  })
}
