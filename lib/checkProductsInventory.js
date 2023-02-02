const COUNTRYS = ['US', 'CA', 'EU'];
const getPm = require('../api/getPM');
var moment = require('moment');
var Product = require('../proxy').Product;
var Listing = require('../proxy').Listing;
var logger = require('../common/logger');
var sheetApi = require('../api/sheetApi.js');
var bot = require('./telegramBot');
const userName = {
  "5103909609": '@laotiework',
  "1863805140": '@BobH153',
  "1707286948": '@shamus0043',
  "1715419547": '@mikevine2011',
  "1891576626": '@joshyan',
  "1870791817": '@trentonamz',
  "1773792388": '@OliverVtime',
  "144689092": '@bryanluo7',
  "5200630130": "@Rachel2911",
  "403318301": "@Jabez153",
  "5716401642": "@Josiah0601",
  "1498416128": "@pete_wang_biz",
  "1825916151": "@Deborahwork",
  "1501831585": "@Jayde_C",
  "1793088091": "@shawnworkv",
  "2144937453": "@JimmyChiu153",
  "1865641476": "@DanielM120"
}

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
    if (products[i].asin) {
      await checkProductByListing(products[i], i + 1, products.length, singleSheet, shortageSheet, inventorySheet);
    }
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
  sendInventoryMessage(asin, country, data, totalDays, availableDays, sheet)
}
async function singleInventoryRecord(asin, country, account, data, sheet) {
  var pm = await getPm(asin, country);
  var content = `${pm}\t${asin}\t${country}\t${data.sales}\t${account}\n`;
  await sheetApi.append(sheet, content.split('\t'));
  sendAccountMessage(asin, country, account)
}

var massage = {
  airExpress: "需要空运，请尽快申请采购",
  seaExpress: "快到快船截止时间，请尽快申请采购",
  sea: "快到慢船截止时间，请尽快申请采购"
}
async function sendInventoryMessage(asin, country, data, totalDays, availableDays, sheet) {
  var pm = await getPm(asin, country);
  var content = `${userName[pm.chat_id]}\t你的产品${asin}\t${country}\t 亚马逊库存只能再卖${totalDays.toFixed(2)}天，请尽快发货\n`;        
  bot.sendReminderMessage(pm.chat_id, content);
}

async function sendAccountMessage(asin, country, account) {
  getPm(asin, country).then(async function(pm) {
    var content = `${userName[pm.chat_id]}\t你的产品${asin}\t只有一个账号${account}，请尽快选择备用账号发货。`;       
    bot.sendReminderMessage(pm.chat_id, content);
  }, function(error) {
    console.log(error);
  })
}
const COUNTRIES = ['US', 'CA', 'UK']
const obj = {
  'chenjin':'1501831585',
  'yaling': '1825916151',
  'sky': '330425740',
  'sky2': '-880860758'
}

async function sendMessage(product, fbaInventory, ps, sales, quantity, orderDues) {
  var pm = null;
  for (var country of COUNTRIES) {
    pm = await getPm(product.asin, country);
    if (pm) {
      break;
    }
  }
  let inboundQty = product.inboundShippeds.reduce((acc, cur) => acc + cur.quantity, 0);
  let purchaseQty = product.producings.reduce((acc, cur) => acc + cur.quantity, 0);
  if (pm && pm.chat_id && userName[pm.chat_id]) {
    var content = `${userName[pm.chat_id]}\t你的产品${product.asin}\t<strong color="#FF0000">需要采购${quantity.quantity}</strong>\t
    发空运采购截止时间${moment(orderDues['airExpress']).format("YYYY-MM-DD")}\t 
    发海运采购截止时间${moment(orderDues['seaExpress']).format("YYYY-MM-DD")}\n
    亚马逊现有库存${fbaInventory}\t
    运输中货物数量${inboundQty}\t
    采购中货物数量${purchaseQty}\t
    仓库库存${product.stock + product.plwhs}\t
    近七天平均销量${ps}\t
    计算使用平均销量${sales}\t
    采购数量计算依据为 ${sales} x 90天
    生产周期${product.cycle}\t`;
    bot.sendReminderMessage(pm.chat_id, content);
  } else {
    var content = `佚名\t你的产品${product.asin}\t<strong color="#FF0000">需要采购${quantity.quantity}</strong>\t
    发空运采购截止时间${moment(orderDues['airExpress']).format("YYYY-MM-DD")}\t 
    发海运采购截止时间${moment(orderDues['seaExpress']).format("YYYY-MM-DD")}\n
    亚马逊现有库存${fbaInventory}\t
    运输中货物数量${inboundQty}\t
    采购中货物数量${purchaseQty}\t
    仓库库存${product.stock + product.plwhs}\t
    近七天平均销量${ps}\t
    计算使用平均销量${sales}\t
    采购数量计算依据为 ${sales} x 90天
    生产周期${product.cycle}\t`;
    bot.sendReminderMessage(pm.chat_id, content);
  }
}

function inventoryCheckRecord(asin, type, quantity, orderDues, inventorySheet) {
  getPm(asin, 'US').then(async function(pm) {
    var content = `${pm.name}\t${asin}\t${quantity.quantity}\t${orderDues['airExpress']}\t${orderDues['airDelivery']}\t${orderDues['seaExpress']}\t${orderDues['sea']}\t${massage[type]}\n`;
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
    inventoryCheckRecord(product.asin, 'airExpress', quantity, orderDues, inventorySheet);
  } else if (moment(orderDues.seaExpress).diff(moment(new Date()), 'days') < 5 && moment(orderDues.seaExpress).diff(moment(new Date()), 'days') >= 0) {
    inventoryCheckRecord(product.asin, 'seaExpress', quantity, orderDues, inventorySheet);
  } else if (moment(orderDues.sea).diff(moment(new Date()), 'days') < 5 && moment(orderDues.sea).diff(moment(new Date()), 'days') >= 0) {
    inventoryCheckRecord(product.asin, 'sea', quantity, orderDues, inventorySheet);
  }
  if (moment(orderDues.seaExpress).diff(moment(new Date()), 'days') < 7) {
    sendMessage(product, fbaInventorySales.inventory, fbaInventorySales.sales, sales.minAvgSales, quantity, orderDues);
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
    var status = await checkProductInventoryShortage(data, 30);
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
