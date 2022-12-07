const COUNTRYS = ['US', 'CA', 'EU'];
const getPm = require('../api/getPM');
var moment = require('moment');
var Product = require('../proxy').Product;
var Listing = require('../proxy').Listing;
var logger = require('../common/logger');
var sheetApi = require('../api/sheetApi.js');

async function checkAllProducts() {
  var products = await Product.findAll();
  logger.info(`There are ${products.length} products need to be check`);
  var shortageSheet = await sheetApi.findOrCreate(moment().format('MM/DD') + 'shortage');
  await sheetApi.setHeader(shortageSheet, ["PM", "ASIN",	"country", "AVAILABLE",	"reservedFCTransfer", "inboundShipped", "Daily sales", "AVAILABLE DAYS LEFT", "TOTAL DAYS LEFT", "老铁初步检查结果", "PM复查结果及反馈原因", "DEV排查原因"], 1);
  var singleSheet = await sheetApi.findOrCreate(moment().format('MM/DD') + 'single');
  await sheetApi.setHeader(singleSheet, ["PM", "ASIN",	"country", "7 days average sales",	"account"], 1);
  var inventorySheet = await sheetApi.findOrCreate(moment().format('MM/DD') + 'inventory');
  await sheetApi.setHeader(inventorySheet, ["PM", "ASIN",	"采购数量", "空运采购时间", "空派采购时间", "快船采购时间", "慢船采购时间", "message"], 1);
  for (var i = 0; i < products.length; i++) {
    await checkProductByListing(products[i], i + 1, products.length, singleSheet, shortageSheet, inventorySheet);
  }
}

async function getCountrisFromListing(listings) {
  var countries = [];

  for (var listing of listings) {
    if (listing.country && countries.indexOf(listing.country) < 0) {
      countries.push(listing.country);
    }
  }

  return countries;
}

async function checkProductByListing(product, index, total, singleSheet, shortageSheet, inventorySheet) {
  logger.info(`total: ${total}, index: ${index}, asin: ${product.asin}`);
  const listings = await Listing.findLisingsByAsin(product.asin);
  const counties = await getCountrisFromListing(listings);
  for(var country of counties) {
    await checkProductByCountry(product, listings, country, singleSheet, shortageSheet);
  }
  await checkProductInventory(product, listings, inventorySheet);
}


async function inventoryShortageRecord(asin, country, data, totalDays, availableDays, sheet) {
  var pm = await getPm(asin, country);
  var content = `${pm}\t${asin}\t${country}\t${data.availableQuantity}\t${data.reservedFCTransfer}\t${data.inboundShipped}\t${data.sales.toFixed(2)}\t${availableDays.toFixed(2)}\t${totalDays.toFixed(2)}\n`;
  await sheetApi.append(sheet, content.split('\t'));
}
async function singleInventoryRecord(asin, country, account, data, sheet) {
  var pm = await getPm(asin, country);
  var content = `${pm}\t${asin}\t${country}\t${data.sales}\t${account}\n`;
  await sheetApi.append(sheet, content.split('\t'));
}

var massage = {
  airExpress: "需要空运，请尽快申请采购",
  seaExpress: "快到快船截止时间，请尽快申请采购",
  sea: "快到慢船截止时间，请尽快申请采购"
}

function inventoryCheckRecord(asin, type, quantity, orderDues, inventorySheet) {
  getPm(asin, 'US').then(async function(pm) {
    var content = `${pm}\t${asin}\t${quantity.quantity}\t${orderDues['airExpress']}\t${orderDues['airDelivery']}\t${orderDues['seaExpress']}\t${orderDues['sea']}\t${massage[type]}\n`;
    await sheetApi.append(inventorySheet, content.split('\t'));
  }, function(error) {
    console.log(error);
  })
}

async function checkProductInventory(product, listings, inventorySheet) {
  var fbaInventorySales = await Product.prepareFbaInventoryAndSalesV2(product.asin, listings);
  var sales = await Product.getSales(fbaInventorySales, product);
  var stock = product.stock + product.plwhs;
  var totalInventory = fbaInventorySales.inventory + stock;
  var quantity = await Product.getQuantity(sales, totalInventory, product);
  console.log(product.asin, 'quantity done');
  if (quantity.boxes <= 0) {
    console.log("Inventory is enough, do not need to purchase any more");
    await Product.updateProduct(product, {orderDues: [], orderQuantity: 0});
    await Product.save(product);
    return quantity;
  }
  
  var orderDues = await Product.getOrderDue(product, totalInventory, sales);
  await Product.updateProduct(product, {orderQuantity: quantity.quantity, orderDues: await Product.prepareOrderDues(orderDues)});

  await Product.save(product);

  if (moment(orderDues.airExpress).diff(moment(new Date()), 'days') < 5) {
    inventoryCheckRecord(product.asin, 'airExpress', quantity, inventorySheet);
  } else if (moment(orderDues.seaExpress).diff(moment(new Date()), 'days') < 5 && moment(orderDues.seaExpress).diff(moment(new Date()), 'days') >= 0) {
    inventoryCheckRecord(product.asin, 'seaExpress', quantity, inventorySheet);
  } else if (moment(orderDues.sea).diff(moment(new Date()), 'days') < 5 && moment(orderDues.sea).diff(moment(new Date()), 'days') >= 0) {
    inventoryCheckRecord(product.asin, 'sea', quantity, inventorySheet);
  }
}

async function checkProductInventoryShortage(data, period) {
  var availableDays = (data.availableQuantity) / data.sales;
  var totalDays = (data.availableQuantity + data.reservedFCTransfer + data.inboundShipped) / data.sales;
  var shortage = totalDays < period;
  return {
    shortage: shortage,
    availableDays: availableDays,
    totalDays: totalDays
  };
}

async function getListingAccountsCountByCountry(listings, country, asin) {
  var count = 0;
  var singleAccount = null;
  for (var listing of listings) {
    if (listing.asin === asin && listing.country === country) {
      count++;
      singleAccount = listing.account;
    }
  }
  return ({
    count: count,
    account: singleAccount
  })
}

async function checkProductSingleInventory(data, listings, country, asin) {
  if ((country.toUpperCase() === 'US' && (data.sales > 30)) || (country.toUpperCase() === 'CA' && (data.sales > 15))) {
    var accountCounts = await getListingAccountsCountByCountry(listings, country, asin);
    console.log(accountCounts);
    if (accountCounts.count < 2) {
      return accountCounts.account;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

async function checkProductByCountry(product, listings, country, singleSheet, shortageSheet) {
  var data = await Product.prepareFbaInventoryAndSalesByCountryV2(product.asin, country, listings);
  if (data.sales < 1) {
    return;
  } else {
    var status = await checkProductInventoryShortage(data, 10);
    if (status.shortage) {
      await inventoryShortageRecord(product.asin, country, data, status.totalDays, status.availableDays, shortageSheet);
    }
    var account = await checkProductSingleInventory(data, listings, country, product.asin);
    if (account) {
      await singleInventoryRecord(product.asin, country, account, data, singleSheet);
    }
  }
}

module.exports.checkProductsInventory = async function() {
  await checkAllProducts();
}
module.exports.checkProductInventoryShortage = checkProductInventoryShortage;
module.exports.checkProductSingleInventory = checkProductSingleInventory;
module.exports.checkProductInventory = checkProductInventory;
