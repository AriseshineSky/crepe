var fbaInventoryApi = require('../api/gerpgo/fbaInventory');
const path = require('path');
var moment = require('moment');
var token = require('../api/token')

const Listing = require('../proxy').Listing;
var logger = require('../common/logger');

function parseAccountCountry(warehouseName) {
  return new Promise((resolve, reject) => {
    var country = warehouseName.split(":").pop().split("_")[0];
    var account = warehouseName.split(":")[0]
    resolve({
      country: country,
      account: account
    })
  })
}

async function saveListing(listing, data) {
  var savedListing = await Listing.findOrCreate(listing, data);
  Listing.update(savedListing, listing);
}

var getAllListings = async function(token,salt) {
  return new Promise(async (resolve, reject)=>{
    var url = `${gerpgo_api_prefix}` + `${open_apis.fbaInventory}`;
    var i = 1;
    var state = "begin";
    var listings = {};
    while (state !== "end") {
    // while (i < 2) {
      console.log('get listings page: ', i);
      var data = {
        "page": i,
        "sort": "inventoryQuantity",
        "order": "descend",
        "pagesize": 200
      }
      state = await getListingsByBatch(url, data, token, listings, salt);
      i++;
    }
    resolve(listings);
  })
}

var getListingsByBatch = function(url, data, token, listings, salt) {
  return new Promise(function(resolve, reject) {
    setTimeout(async function() {
      var fbaInventoryData = await fbaInventoryApi(url, data, token, salt);
      if (fbaInventoryData.data.from > fbaInventoryData.data.total) {
        resolve("end");
      } else {
        fbaInventoryData.data.rows.forEach(async function(listing) {
          console.log(listing);
          parseAccountCountry(listing.warehouseName).then((data)=>{
            saveListing(listing, data);
          });
        });
        resolve("pending");
      }
    }, 1000);
  });
}

async function syncListingsFromJijia(token, salt) {
  await getAllListings(token, salt);
}

module.exports.syncListings = async function() {
  token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
    async function(token) {
      await syncListingsFromJijia(token, '62daace5e4b073604b7e0b27');
    }, function(error) {
      console.log(error)
    }
  );
  setTimeout(async function() {
    token.getToken2(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
      async function(token) {
        await syncListingsFromJijia(token, '6399d977e4b086e9ac8877e0');
      }, function(error) {
        console.log(error)
      }
    )}, 60000)
}
