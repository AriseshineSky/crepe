var fbaInventoryApi = require('../api/gerpgo/fbaInventory');
const path = require('path');
var writeToFile = require('../api/writeToFile');
const axios = require('axios');
const COUNTRYS = ['US', 'CA', 'EU'];
const getPm = require('../api/getPM');
var moment = require('moment');
var token = require('../api/token')
var Product = require('../proxy').Product;
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
  logger.info(`There are ${Object.keys(listings).length} products in JiJia`);
  var products = await Product.findAll();
  logger.info(`There are ${products.length} products need to be check`);
  for (var i = 0; i < products.length; i++) {
    if (listings[products[i].asin]) {
      await checkProduct(listings[products[i].asin], products[i], i + 1, products.length);
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
  airExpress: "错过空运时间，请尽快申请采购",
  seaExpress: "错过海运时间，请尽快申请采购",
  sea: "快到海运截止时间，请尽快申请采购"
}

function inventoryCheckRecord(asin, type, quantity, producingStatus) {
  getPm(asin).then(function(pm) {
    var content = `${pm}\t${asin}\t\t${type}\t${quantity.quantity}\t${producingStatus.orderDues[type]}\t${massage[type]}\n`;
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
  
  getPm(asin).then(function(pm) {
    var content = `${pm} \t${asin} \t ${msg}\n`;
    writeToFile(`${__dirname}/inventory.csv`, content);
  }, function(error) {
    console.log(error);
  })
}

async function checkProductInventory(product, listings) {
  var fbaInventorySales = await Product.prepareFbaInventoryAndSales(product.asin, {[product.asin]: listings});
  var stock = await Product.prepareStock(product);
  var sales = {
    minAvgSales: Math.ceil(fbaInventorySales.sales),
    maxAvgSales: product.maxAvgSales
  };

  if (sales.minAvgSales < 2) {
    sales.minAvgSales = 2;
  }
  await Product.syncFreight(product);
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
  // 如果只有一批采购任务计算比较准确， 任选一个采购任务按着发货建议的发就行。其余海运
  if (product.producings) {
    logger.debug('producings', product.producings.length);
    for (var producing of product.producings) {
      producingsFreightPlan.push(await Product.getProducingFreightPlan(producing, product, FREIGHT, sales, inbounds));
    }
    if (product.producings.length > 0) {
      producingsFreightPlanRecord(product.asin, producingsFreightPlan);
    }
  }
  var orderDues = await Product.getOrderDue(product, totalInventory, sales, FREIGHT);
  console.log(product.asin, 'orderDues done');
  var producingStatus = await Product.checkProducingsCreated(orderDues, quantity, product, sales);

  if (!producingStatus.placed) {
    if (moment(producingStatus.orderDues.airExpress).isBefore(moment.now())) {
      inventoryCheckRecord(product.asin, 'airExpress', quantity, producingStatus);
    } else if (moment(producingStatus.orderDues.seaExpress).isBefore(moment.now())) {
      inventoryCheckRecord(product.asin, 'seaExpress', quantity, producingStatus);
    } else if (moment(producingStatus.orderDues.sea).diff(moment(new Date()), 'days') < 7) {
      inventoryCheckRecord(product.asin, 'sea', quantity, producingStatus);
    }
  }
}

async function checkProductInventoryShortage(data, period) {
  var totalDays = (data.availableQuantity + data.reservedFCTransfer + data.inboundShipped) / data.sales;
  return totalDays < period;
}

async function checkProductSingleInventory(data, listings, country) {
  if ((country.toUpperCase() === 'US' && (data.sales > 30)) || (country.toUpperCase() === 'CA' && (data.sales > 15))) {
    return Object.keys(listings[country]).length < 2;
  } else {
    return false;
  }
  
}

async function checkProductByCountry(product, listings, country) {
  var data = await getProductInventorySalesByCountry(listings[country])
  if (data.sales < 1) {
    return;
  } else {
    if (await checkProductInventoryShortage(data, 10)) {
      inventoryShortageRecord(product.asin, country, data, totalDays, availableDays);
    }
    if (await checkProductSingleInventory(data, listings, country)) {
      singleInventoryRecord(product.asin, country, Object.values(listings[country])[0], data);
    }
  }
}
var checkProduct = async function(listings, product, index, total) {
  logger.info(`total: ${total}, index: ${index}, asin: ${product.asin}`);
  for(var country in listings) {
    await checkProductByCountry(product, listings, country);
  }
  await checkProductInventory(product, listings);
}

var getAllListings = async function(token) {
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
      logger.debug("new all listing instance");
      this.createdAt = new Date();
      this.instance.listings = await getAllListings(token);
    } else if (await this.checkExpired()) {
      this.instance.listings = await getAllListings(token);
    }
    return this.instance;
  }

  static async checkExpired() {
    var stime = Date.parse(this.createdAt);
    var etime = Date.parse(new Date());
    var hours = Math.floor((etime - stime) / (3600 * 1000));
    return hours > 1;
  }
}

async function checkProductsInventory(token) {
  const listingInstance = await Listing.getInstance(token);
  var listings = listingInstance.listings;
  await checkProducts(listings);
  logger.info("done");
}
// module.exports = async function() {
//   token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
//     async function(token) {
//       await checkProductsInventory(token);
//     }, function(error) {
//       console.log(error)
//     }
//   )
// }

module.exports.checkProductsInventory = async function() {
  token.getToken(`${gerpgo_api_prefix}` + `${open_apis.token}`).then(
    async function(token) {
      await checkProductsInventory(token);
    }, function(error) {
      console.log(error)
    }
  )
}
module.exports.checkProductInventoryShortage = checkProductInventoryShortage;
module.exports.checkProductSingleInventory = checkProductSingleInventory;
module.exports.getProductInventorySalesByCountry = getProductInventorySalesByCountry;