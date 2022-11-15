var fbaInventoryApi = require('../api/gerpgo/fbaInventory');
const path = require('path');
var writeToFile = require('../api/writeToFile');
const axios = require('axios');
const COUNTRYS = ['US', 'CA', 'EU'];
const getPm = require('../api/getPM');
var moment = require('moment');
var token = require('../api/token')
var Product = require('../proxy').Product;
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

async function checkProducts(listings) {
  console.log(Object.keys(listings).length)
  var products = await Product.findAll();
  console.log(products.length);
  for (var product of products) {
    if (listings[product.asin]) {
      await checkProduct(listings[product.asin], product.asin);
    }
   
  }
}

async function getProductInventorySalesByCountry(data) {

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

  return ({
    availableQuantity: availableQuantity,
    reservedFCTransfer: reservedFCTransfer,
    inboundShipped: inboundShipped,
    sales: sales
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

var massage = {
  air: "错过空运时间，请尽快申请采购",
  sea: "错过海运时间，请尽快申请采购",
}

function inventoryCheckRecord(asin, country, type) {
  getPm(asin).then(function(pm) {
    var content = `${pm} \t${asin} \t${country} \t ${massage[type]}\n`;
    writeToFile(`${__dirname}/inventory.csv`, content);
  }, function(error) {
    console.log(error);
  })
}

async function checkProductByCountry(asin, product, country) {
  var data = await getProductInventorySalesByCountry(product[country])
  if (data.sales < 1) {
    return;
  } else {
    var availableDays = (data.availableQuantity) / data.sales;
    var totalDays = (data.availableQuantity + data.reservedFCTransfer + data.inboundShipped) / data.sales;
    if (totalDays < 10) {
      inventoryShortageRecord(asin, country, data, totalDays, availableDays);
    }

    if ((country.toUpperCase() == 'US' && (data.sales > 30)) || (country.toUpperCase() == 'CA' && (data.sales > 15))) {
      if (product) {
        if (Object.keys(product[country]).length < 2) {
          singleInventoryRecord(asin, country, Object.values(product[country])[0], data);
        }
      } else {
        console.log(product);
        console.log(asin);
      }
      
    }
    
    var fbaInventorySales = await Product.prepareFbaInventoryAndSales(asin, product);

    product = await Product.getProductByAsin(asin);

    if (product) {
      console.log(product.asin);
      var stock = await Product.prepareStock(product);
      console.log(product.asin, 'stock done');
      var sales = {
        minAvgSales: Math.ceil(fbaInventorySales.sales),
        maxAvgSales: product.maxAvgSales
      };
      console.log(product.asin, 'sales done');
      await Product.syncFreight(product);
      console.log(product.asin, 'syncFreight done');
      // await Product.removeDeliveredInbounds(product);
      var inboundShippeds = product.inboundShippeds;
      var totalInventory = fbaInventorySales.inventory + stock;
      
      var quantity = await Product.getQuantity(sales, totalInventory, product, inboundShippeds);
      console.log(product.asin, 'quantity done');
      if (quantity.boxes < 0) {
        console.log("Inventory is enough, do not need to purchase any more");
        return quantity;
      }
      var orderDues = await Product.getOrderDue(product, totalInventory, sales, FREIGHT, product.inboundShippeds);
      console.log(product.asin, 'orderDues done');
      if (moment(orderDues.air).isBefore(moment.now())) {
        inventoryCheckRecord(asin, country, 'air');
      } else if (moment(orderDues.seaExpress).isBefore(moment.now())) {
        inventoryCheckRecord(asin, country, 'sea');
      }
    } else {

    }
  }
}
var checkProduct = async function(product, asin) {
  for(var country in product) {
    await checkProductByCountry(asin, product, country);
  }
}

var getAllListings = async function(token) {
  return new Promise(async (resolve, reject)=>{
    var url = `${gerpgo_api_prefix}` + `${open_apis.fbaInventory}`;
    var i = 1;
    var state = "begin";
    var listings = {};
    // while (state !== "end") {
    while (i < 2) {
      console.log('get listings page: ', i);
      var data = {
        "page": i,
        "sort": "inventoryQuantity",
        "order": "descend",
        "pagesize": 200
      }
      state = await getListingsByBatch(url, data, token, listings);
      i++;
    }
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

async function checkProductsInventory(token) {
  var listings = await getAllListings(token);
  await checkProducts(listings);
}
module.exports = async function() {
  token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
    async function(token) {
      await checkProductsInventory(token);
    }, function(error) {
      console.log(error)
    }
  )
}
