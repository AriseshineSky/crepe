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
  console.log(Object.keys(listings).length);
  var products = await Product.findAll();
  console.log(`There are ${products.length} products need to be check`);
  for (var i = 0; i < products.length; i++) {
    if (listings[products[i].asin]) {
      await checkProduct(listings[products[i].asin], products[i], i, products.length);
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
async function formatPlan(plan) {
  console.log(plan);
  var msg = {};
  for (var type in plan) {
    if (plan[type]["boxes"] && plan[type]["boxes"] > 0) {
      msg[type] = {
        boxes: plan[type]["boxes"]
      }
    }
  }
  return msg;
}
async function producingsFreightPlanRecord(asin, producingsFreightPlan) {
  var msg = '';
  for (var plan of producingsFreightPlan) {
    msg += `${JSON.stringify(await formatPlan(plan))}\t`;
  }
  
  console.log(producingsFreightPlan);
  getPm(asin).then(function(pm) {
    var content = `${pm} \t${asin} \t ${msg}\n`;
    writeToFile(`${__dirname}/inventory.csv`, content);
  }, function(error) {
    console.log(error);
  })
}

async function checkProductByCountry(product, listings, country) {
  var data = await getProductInventorySalesByCountry(listings[country])
  if (data.sales < 1) {
    return;
  } else {
    var availableDays = (data.availableQuantity) / data.sales;
    var totalDays = (data.availableQuantity + data.reservedFCTransfer + data.inboundShipped) / data.sales;
    if (totalDays < 10) {
      inventoryShortageRecord(product.asin, country, data, totalDays, availableDays);
    }

    if ((country.toUpperCase() == 'US' && (data.sales > 30)) || (country.toUpperCase() == 'CA' && (data.sales > 15))) {
      if (listings) {
        if (Object.keys(listings[country]).length < 2) {
          singleInventoryRecord(product.asin, country, Object.values(listings[country])[0], data);
        }
      } else {
        console.log(listings);
        console.log(product);
      }
    }
    var fbaInventorySales = await Product.prepareFbaInventoryAndSales(product.asin, product);
    
    var stock = await Product.prepareStock(product);
    console.log(product.asin, 'stock done');
    var sales = {
      minAvgSales: Math.ceil(fbaInventorySales.sales),
      maxAvgSales: product.maxAvgSales
    };
    console.log(product.asin, 'sales done');
    await Product.syncFreight(product);
    // await Product.convertProductingsIntoInbounds(product);
    console.log(product.asin, 'syncFreight done');
    // await Product.removeDeliveredInbounds(product);
    var totalInventory = fbaInventorySales.inventory + stock;
    var quantity = await Product.getQuantity(sales, totalInventory, product, product.inboundShippeds, product.producings);
    console.log(product.asin, 'quantity done');
    if (quantity.boxes <= 0) {
      console.log("Inventory is enough, do not need to purchase any more");
      return quantity;
    }
    var inbounds = await Product.convertInboundShippedsDeliveryDueToPeroid(product.inboundShippeds);
    await Product.addCurrentInventoryToInbounds(totalInventory, inbounds);
    console.log(inbounds)
    var producingsFreightPlan = [];
    for (var producing of product.producings) {
      producingsFreightPlan.push(await Product.getProducingFreightPlan(producing, product, FREIGHT, sales, inbounds));
    }
    if (producingsFreightPlan.length > 0) {
      producingsFreightPlanRecord(product.asin, producingsFreightPlan);
    }
    var orderDues = await Product.getOrderDue(product, totalInventory, sales, FREIGHT, product.inboundShippeds, product.producings);
    console.log(product.asin, 'orderDues done');
    if (moment(orderDues.air).isBefore(moment.now())) {
      inventoryCheckRecord(product.asin, country, 'air');
    } else if (moment(orderDues.seaExpress).isBefore(moment.now())) {
      inventoryCheckRecord(product.asin, country, 'sea');
    }
  }
}
var checkProduct = async function(listings, product, index, total) {
  console.log(`total: ${total}, index: ${index}, asin: ${product.asin}`);
  for(var country in listings) {
    await checkProductByCountry(product, listings, country);
  }
}

var getAllListings = async function(token) {
  return new Promise(async (resolve, reject)=>{
    var url = `${gerpgo_api_prefix}` + `${open_apis.fbaInventory}`;
    var i = 1;
    var state = "begin";
    var listings = {};
    // while (state !== "end") {
    while (i < 5) {
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

class Listing {
  constructor() {
    this.listings = null;
  }

  static async getInstance(token) {
    if (!this.instance) {
      this.instance = new Listing();
      this.instance.listings = await getAllListings(token);
    }
    return this.instance;
  }
}

async function checkProductsInventory(token) {
  const listingInstance = await Listing.getInstance(token);
  var listings = listingInstance.listings;
  // var listings = await getAllListings(token);
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
