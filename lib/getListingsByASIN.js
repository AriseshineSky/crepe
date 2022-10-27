var fbaInventoryApi = require('../api/gerpgo/fbaInventory');
const path = require('path');
var writeToFile = require('../api/writeToFile');
const axios = require('axios');
const COUNTRYS = ['US', 'CA', 'EU'];
const getPm = require('../api/getPM');
const logger = require('../logs');
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

function listingObject(listing) {
  return {
    warehouseId: listing.warehouseId,
    warehouseName: listing.warehouseName,
    availableQuantity: listing.availableQuantity,
    reservedFCTransfer: listing.reservedFCTransfer,
    reservedFCProcessing: listing.reservedFCProcessing,
    inboundShipped: listing.inboundShipped,
    ps: listing.ps
  }
}

function parseListing(listing, listings) {
  return new Promise((resolve, reject)=>{
    parseAccountCountry(listing.warehouseName).then((data)=>{
      if (listings.hasOwnProperty(listing.asin)) {
        if (listings[listing.asin].hasOwnProperty(data.country)) {
          if (listings[listing.asin][data.country].hasOwnProperty(data.account)) {
            listings[listing.asin][data.country][data.account].push(listingObject(listing));
          } else {
            listings[listing.asin][data.country][data.account] = [listingObject(listing)];
          }
        } else {
          listings[listing.asin][data.country] = {[data.account]: [listingObject(listing)]};
        }
      } else {
        listings[listing.asin] = {
          [data.country]: {[data.account]: [listingObject(listing)]}
        };
      }
      resolve(listing);
    })
  })
}

function checkProducts(listings) {
  return new Promise((resolve, reject) => {
    console.log(Object.keys(listings).length)
    for(var asin in listings) {
      checkProduct(listings[asin], asin);
    }
    resolve(Object.keys(listings).length)
  })
}


// function getProductInventorySalesByAccount(data) {
//   return new Promise((resolve, reject)=>{
//     var availableQuantity = 0;
//     var reservedFCTransfer = 0;
//     var sales = 0;
//     for(var listing of data) {
//       availableQuantity = availableQuantity + listing.availableQuantity;
//       reservedFCTransfer = reservedFCTransfer + listing.reservedFCTransfer;
//       sales = sales + listing.ps;
//     }
//     resolve({
//       availableQuantity: availableQuantity,
//       reservedFCTransfer: reservedFCTransfer,
//       sales: sales
//     });
//   })
// }

// async function getProductInventorySalesByCountry(data) {
//   return new Promise(async (resolve, reject)=>{
//     var availableQuantity = 0;
//     var reservedFCTransfer = 0;
//     var sales = 0;
//     for(var account in data) {
//       console.log('----')
//       console.log(sales)
//       await getProductInventorySalesByAccount(data[account]).then((data)=>{
//         availableQuantity = availableQuantity + data.availableQuantity;
//         reservedFCTransfer = reservedFCTransfer + data.reservedFCTransfer;
//         sales = sales + data.sales;
//         console.log(data.sales)
//         console.log(sales)
//       })
//     }
//     console.log(sales)
//     resolve({
//       availableQuantity: availableQuantity,
//       reservedFCTransfer: reservedFCTransfer,
//       sales: sales
//     })
//   })
// }

async function getProductInventorySalesByCountry(data) {
  return new Promise(async (resolve, reject)=>{
    var availableQuantity = 0;
    var reservedFCTransfer = 0;
    var inboundShipped = 0;
    var sales = 0;
    for(var account in data) {
      for(var listing of data[account]) {
        availableQuantity = availableQuantity + listing.availableQuantity;
        reservedFCTransfer = reservedFCTransfer + listing.reservedFCTransfer;
        inboundShipped = inboundShipped + listing.inboundShipped;
        sales = sales + listing.ps;
      } 
    }
  
    resolve({
      availableQuantity: availableQuantity,
      reservedFCTransfer: reservedFCTransfer,
      inboundShipped: inboundShipped,
      sales: sales
    })
  })
}

function inventoryShortageRecord(asin, country, data, totalDays, availableDays) {
  getPm(asin).then(function(pm) {
    var content = `${pm} \t${asin} \t${country} \t${data.availableQuantity} \t${data.reservedFCTransfer} \t${data.inboundShipped} \t${data.sales.toFixed(2)} \t${availableDays.toFixed(2)} \t${totalDays.toFixed(2)}\n`;
    writeToFile(`${__dirname}/accounts.csv`, content);
  }, function(error) {
    console.log(error);
  });
}
function singleInventoryRecord(asin, country, account, data) {
  getPm(asin).then(function(pm) {
    var content = `${pm} \t${asin} \t${country} \t${data.sales} \t${account[0].warehouseName}\n`;
    writeToFile(`${__dirname}/list.csv`, content);
  }, function(error) {
    console.log(error);
  })
}

function checkProductByCountry(asin, product, country) {
  getProductInventorySalesByCountry(product[country]).then((data)=>{
    if (data.sales < 1) {
      return;
    } else {
      var availableDays = (data.availableQuantity) / data.sales;
      var totalDays = (data.availableQuantity + data.reservedFCTransfer + data.inboundShipped) / data.sales;
      if (totalDays < 10) {
        inventoryShortageRecord(asin, country, data, totalDays, availableDays);
      }

      if ((country.toUpperCase() == 'US' && (data.sales > 30)) || (country.toUpperCase() == 'CA' && (data.sales > 15))) {
        if (Object.keys(product[country]).length < 2) {
          singleInventoryRecord(asin, country, Object.values(product[country])[0], data);
        }
      }
    }
  })
}
var checkProduct = async function(product, asin) {
  for(var country in product) {
    checkProductByCountry(asin, product, country);
  }
}

var getInventory = async function(token, asin) {
  return new Promise(async (resolve, reject)=>{
    var url = `${gerpgo_api_prefix}` + `${open_apis.fbaInventory}`;
    var i = 1;
    var state = "begin";
    var listings = {};
    var data = {
      "page": i,
      "sort": "inventoryQuantity",
      "order": "descend",
      "asin": asin,
      "pagesize": 200
    }
    state = await getListingsByBatch(url, data, token, listings);
    resolve(listings);
  })
}

var getListingsByBatch = function(url, data, token, listings) {
  return new Promise(function(resolve, reject) {
    setTimeout(async function() {
      var fbaInventoryData = await fbaInventoryApi(url, data, token);
      if (fbaInventoryData.data.from > fbaInventoryData.data.total) {
        resolve("end");
      } else {
        fbaInventoryData.data.rows.forEach(async function(listing) {
          await parseListing(listing, listings);
        });
        resolve("pending");
      }
    }, 1000);
  });
}

async function getInventoryByASIN(token, asin) {
  var listings = await getInventory(token, asin);
  return listings;
}
module.exports = async function(getToken, asin) {
  var token = await getToken.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`);
  console.log(token);
  logger.info("token", token);
  return(await getInventoryByASIN(token, asin));
}
