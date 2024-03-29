var models  = require('../models');
var Product = models.Product;
var user = require('./user');
var mongoose = require('mongoose');
const getPm = require('../api/getPM');
var moment = require('moment');
const GAP = 4;
var getFbaInventoryByASIN = require('../lib/getFbaInventoryByASIN')
var getStockByProduct = require('../lib/getStockByProduct');
var getPlwhsByProduct = require('../lib/getPlwhsByProduct');
var Freight = require('./freight');
var logger = require('../common/logger');
async function getFreight(product) {
  Freight.getFreightsAndProductingsByProduct(product);
}
async function checkProducings(product, freightsAndProducings) {
  for(var j = 0; j < freightsAndProducings.producings.length; j++) {
    for(var i = 0; i < product.producings.length; i++) {
      if (product.producings[i].orderId === freightsAndProducings.producings[j].orderId) {
        freightsAndProducings.producings[j].deliveryDue = product.producings[i].deliveryDue;
      }
    }
  }
}

async function getProducingsQuantity(producings) {
  var quantity = 0;
  for(var i = 0; i < producings.length; i++) {
    quantity += producings[i].quantity
  }
  return quantity;
}
async function syncFreight(product, days) {
  var freightsAndProducings = await Freight.getFreightsAndProductingsByProduct(product, days);
  await checkProducings(product, freightsAndProducings);
  product.inboundShippeds = freightsAndProducings.inboundShippeds;
  product.producings = freightsAndProducings.producings;
  product.purchase = await getProducingsQuantity(product.producings);
  product.save(function (err) {
    if (err) {
      logger.error(err);    
    }
  });
}

exports.syncFreight = syncFreight;
exports.getFreight = getFreight;
async function checkStatus(inbound, units, sales) {
  return(units - inbound.period * sales.minAvgSales);
}

async function syncPm() {
  var products = await findAll();
  for (var product of products) {
    var name = await getPm(product.asin, 'US');
    logger.debug(name);
    var pm = await user.findOrCreate(name);
    logger.debug(pm);
    product.pm = pm;
    product.save(function(error) {
      if (error) {
        logger.error(error);
      }
    })
  }
}
exports.syncPm = syncPm;
function compare(type) {
  return function(m, n) {
    return m[type] - n[type];
  }
}

async function sortQueue(inboundQueue) {
  return inboundQueue.sort(compare('period'))
}

async function calculateInboundQueue(inbounds, sales) {
  var inboundQueue = [];
  inboundQueue[0] = {
    period: inbounds[0].period,
    inventory: {
      before: inbounds[0].quantity,
      after: inbounds[0].quantity
    }
  }
  for(var i = 1; i < inbounds.length; i++) {
    var units = 0;
    for (var j = 0; j < i; j++) {
      units += inbounds[j].quantity;
    }
    var items = await checkStatus(inbounds[i], units, sales);
    inboundQueue[i] = {
      period: inbounds[i].period,
      inventory: {
        before: items,
        after: items + inbounds[i].quantity
      }
    }
  }
  return inboundQueue;
}

async function calculateOutOfStockPeriod(status) {
  var period = 0;

  for (var i = 0; i < status.length - 1; i++) {
    if (status[i].before === 0 && status[i].after === 0) {
      period += (status[i+1].period - status[i].period + 1);
    }
  }
  return period;
}

async function calculateProducingFirstOutOfStockPeriod(status) {
  var period = 0;

  for (var i = 0; i < status.length; i++) {
    if (status[i].before === 0 && status[i].after === 0) {
      period += (status[i+1].period - status[i].period + 1);
    }
  }
  return period;
}

async function calculateMinInventory(freight, freightType, status, sales, product) {
  var period = 0;
  var minInventory = 100000;
  var type = freightType[0];
  for (var i = 0; i < status.length; i++) {
    if (status[i].period > freight[type].period + product.cycle) {
      period = Math.floor(status[i].before / sales.minAvgSales);
      if (period < minInventory) {
        minInventory = period;
      }
    }
  }
  logger.debug('minInventory', minInventory);
  return minInventory;
}

async function calculateProducingMinInventory(freight, freightType, status, sales, product, producing) {
  var period;
  var minInventory = 100000;
  var days = await getProducingPeriod(product, producing);
  var type = freightType[0];
  for (var i = 0; i < status.length; i++) {
    if (status[i].period > freight[type].period + days) {
      period = Math.floor(status[i].before / sales.minAvgSales);
      if (period < minInventory) {
        minInventory = period;
      }
    }
  }
  logger.debug('minInventory', minInventory);
  return minInventory;
}


async function calculateProducingMinInventoryObj(freight, freightType, status, sales, product, producing) {
  var minInventory = {};
  for (var j = 0; j < freightType.length; j++) {
    minInventory[freightType[j]] = 10000;
  }
  var minInventory = 100000;
  var days = await getProducingPeriod(product, producing);
  for (var j = 0; j < freightType.length; j++) {
    for (var i = 0; i < status.length; i++) {
      var type = freightType[j];
      if (status[i].period === freight[type].period + days) {
        minInventory[type] = Math.floor(status[i].before / sales.minAvgSales);
      }
    }
  }
  logger.debug('minInventory', minInventory);
  return minInventory;
}

async function recalculateInboundQueue(inboundQueue, sales) {
  var states = [];
  var newInboundQueue = JSON.parse(JSON.stringify(inboundQueue));
  for(var i = 0; i < newInboundQueue.length; i++) {
    if (newInboundQueue[i].inventory.before < 0) {
      var period = Math.ceil(-newInboundQueue[i].inventory.before / sales.minAvgSales)
      states.push(
        {
          period: newInboundQueue[i].period - period,
          before: 0,
          after: 0
        }
      )
      var gap = -newInboundQueue[i].inventory.before;
      for (var j = i; j < newInboundQueue.length; j++) {
        newInboundQueue[j].inventory.before += gap
        newInboundQueue[j].inventory.after += gap
      }
    }
    states.push(
      {
        period: newInboundQueue[i].period,
        before: newInboundQueue[i].inventory.before,
        after: newInboundQueue[i].inventory.after
      }
    )
  }
  return states;
}


async function convertDeliveryDueToPeroid(inbound) {
  var delivery = moment(inbound.deliveryDue);
  return(delivery.diff(moment(), "days") + 7);
}

async function convertInboundShippedsDeliveryDueToPeroid(inboundShippeds) {
  var inbounds = [];
  if (inboundShippeds) {
    for(var inbound of inboundShippeds) {
      inbound.period = await convertDeliveryDueToPeroid(inbound);
      inbounds.push({
        period: inbound.period,
        quantity: inbound.quantity
      });
    }
  }
  return inbounds;
}
exports.convertInboundShippedsDeliveryDueToPeroid = convertInboundShippedsDeliveryDueToPeroid;
exports.addCurrentInventoryToInbounds = addCurrentInventoryToInbounds;
async function convertInboundsToSortedQueue(inbounds) {
  var sortedInbounds = await sortQueue(inbounds);
  return sortedInbounds;
}

async function addCurrentInventoryToInbounds(totalInventory, inboundShippeds) {
  inboundShippeds.push({
    quantity: totalInventory,
    period: 0
  })
}

async function addShipmentToInbounds(shipment, inbounds) {
  if (inbounds) {
    var newInbounds = JSON.parse(JSON.stringify(inbounds));
  } else {
    var newInbounds = [];
  }
  newInbounds.push({
    quantity: shipment.quantity,
    period: shipment.period
  })
  return newInbounds;
}

async function addFreightPlanToInbounds(freightPlan, freight, inbounds, product) {
  var newInbounds = JSON.parse(JSON.stringify(inbounds));
  for(var type in freightPlan) {
    var shipment = {
      quantity: await totalUnits(freightPlan[type].boxes, product.unitsPerBox),
      period: product.cycle + freight[type].period
    }
    newInbounds = await addShipmentToInbounds(shipment, newInbounds)
  }
  return newInbounds;
}
async function getProducingPeriod(product, producing) {
  var days = 0;
  if (producing.deliveryDue) {
    days = moment(producing.deliveryDue).diff(moment(), "days");
  } else {
    days = product.cycle - moment().diff(moment(producing.created), "days");
  }
  if (days < 0) {
    days = 0;
  }
  return days;
}
async function addProducingFreightPlanToInbounds(freightPlan, freight, inbounds, product, producing) {
  var newInbounds = JSON.parse(JSON.stringify(inbounds));
  var days = await getProducingPeriod(product, producing);
  for(var type in freightPlan) {
    var shipment = {
      quantity: await totalUnits(freightPlan[type].boxes, product.unitsPerBox),
      period: days + freight[type].period
    }
    newInbounds = await addShipmentToInbounds(shipment, newInbounds)
  }
  return newInbounds;
}

async function updateProduct(product, attrs) {
  for(var key in attrs) {
    product[key] = attrs[key];
  }
}
async function prepareStock(product) {
  var quantity = 0;
  var yStock = 0;
  var pStock = 0;
  var stock = await getStockByProduct(product);
  var plwhs = await getPlwhsByProduct(product);
  if (stock.inventory) {
    quantity += stock.inventory.SumNumber;
    yStock = stock.inventory.SumNumber;
  }
  if (plwhs) {
    quantity += plwhs.qty;
    pStock = plwhs.qty; 
  }
  await updateProduct(product, {stock: yStock, plwhs: pStock});
  return quantity;
}
exports.prepareStock = prepareStock;
var findAll = async function() {
  return await Product.find({}).populate('pm');
}

var findAllAsins = async function() {
  return Product.find().select('asin');
}
exports.findAllAsins = findAllAsins;
async function prepareFbaInventoryAndSales(asin, listings) {
  var inventory = 0;
  var sales = 0;
  if (!listings) {
    listings = await getFbaInventoryByASIN(asin);
  }
  logger.debug(JSON.stringify(listings));
  for(var country in listings[asin]) {
    for(var account in listings[asin][country]) {
      for(var listing of listings[asin][country][account]) {
        inventory = inventory + listing.availableQuantity + listing.reservedFCTransfer + listing.inboundShipped;
        sales = sales + listing.ps;
      }
    }
  }
  return {
    inventory: inventory,
    sales: sales
  }
}


async function removeDeliveredInbounds(product) {
  product.inboundShippeds.forEach(async function(inbound) {
    if (moment(new Date()).diff(moment(inbound.deliveryDue), 'days') > 10) {
      await Product.update({"inboundShippeds._id": inbound._id}, { $pull:{'inboundShippeds': {"_id": inbound._id}}})
    }
  });
}
exports.removeDeliveredInbounds = removeDeliveredInbounds;
async function getFbaSalesPeriod(fbaInventorySales) {
  return Math.floor(fbaInventorySales.inventory / fbaInventorySales.sales)
}

async function getStockSalesPeriod(fbaInventorySales, stock) {
  return Math.floor(stock / fbaInventorySales.sales)
}

var generateReport = async function(asin) {
  var messages = [];
  var report = await getInventoryReport(asin);
  if (report.fbaSalesPeriod < 10) {
    messages.push(`${asin} 亚马逊库存不足10天`);
    if (report.stock > 0) {
      messages.push(`请把仓库中${report.stock}发往亚马逊`);
    }
  }
  if (report.gap > 0) {
    messages.push(`当前的发货计划可能会造成断货`);
  }
  console.log(report);
}

exports.generateReport = generateReport;

var getInventoryReport = async function(asin) {
  var report = {};
  var product = await getProductByAsin(asin);
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);
  console.log(fbaInventorySales);
  var fbaSalesPeriod = await getFbaSalesPeriod(fbaInventorySales);
  var stock = await prepareStock(product);
  var stockSalesPeriod = await getStockSalesPeriod(fbaInventorySales, stock);
  await syncFreight(product);

  var inbounds = await convertInboundShippedsDeliveryDueToPeroid(product.inboundShippeds);

  await addCurrentInventoryToInbounds(fbaInventorySales.inventory + stock, inbounds);
  var newInbounds = await convertInboundsToSortedQueue(inbounds);
  var sales = await getSales(fbaInventorySales, product);
  var inboundQueue = await calculateInboundQueue(newInbounds, sales);
  var status = await recalculateInboundQueue(inboundQueue, sales);
  var gap = await calculateOutOfStockPeriod(status);
  report.fbaSalesPeriod = fbaSalesPeriod;
  report.inventory = fbaInventorySales.inventory;
  report.stock = fbaInventorySales.stock;
  report.stockSalesPeriod = stockSalesPeriod;
  report.status = status;
  report.gap = gap;
  return report;
}
exports.getPlanWithProducings = async function(asin) {
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);
  console.log(fbaInventorySales);
  var product = await getProductByAsin(asin);
  var stock = await prepareStock(product);
  var sales = await getSales(fbaInventorySales, product);
  var inboundShippeds = product.inboundShippeds;
  var totalInventory = fbaInventorySales.inventory + stock;
  var quantity = await getQuantity(sales, totalInventory, product);
  console.log(quantity);
  if (quantity.boxes < 0) {
    console.log("Inventory is enough, do not need to purchase any more");
    return quantity;
  }

  var inbounds = await convertInboundShippedsDeliveryDueToPeroid(inboundShippeds);
  await addCurrentInventoryToInbounds(totalInventory, inbounds);
  console.log(inbounds)
  
  var minTotalSalesPeriod =  totalInventory / sales.maxAvgSales;
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var orderDues = await getOrderDue(product, totalInventory, sales, await prepareFreight(FREIGHT, 7));
 
  console.log(orderDues);
  var deliveryDue = await getDeliveryDue(totalInventory, inboundShippeds, sales, inboundShippeds);
  console.log(deliveryDue);
  
  var producingsStatus = await checkProducingsCreated(orderDues, quantity, product, sales);
  console.log(producingsStatus);
  var plan = await bestPlanV4(quantity, product, await prepareFreight(FREIGHT, 7), sales, inbounds);
  var volumeWeightCheck = true;
  for (var type in plan) {
    if (plan[type].units > 0) {
      if (!checkVolumeWeight(product.box, type)) {
        volumeWeightCheck = false;
      }
    }
  }
  var purchase = {
    asin: asin,
    plan: plan,
    sales: sales,
    minTotalSalesPeriod: Math.ceil(minTotalSalesPeriod),
    maxTotalSalesPeriod: Math.ceil(maxTotalSalesPeriod),
    totalInventory: totalInventory,
    fbaInventory: fbaInventorySales.inventory,
    stock: stock,
    inboundShippeds: inboundShippeds,
    volumeWeightCheck: volumeWeightCheck,
    orderDues: orderDues,
    producingsStatus: producingsStatus,
    quantity: quantity,
    deliveryDue: deliveryDue,
    product: product
  }
  console.log(purchase);
  return(purchase);
}

async function getSales(fbaInventorySales, product) {
  // product.ps = Math.ceil(fbaInventorySales.sales);
  await updateProduct(product, {ps: Math.ceil(fbaInventorySales.sales), fbaInventory: fbaInventorySales.inventory});
  var avgSales;
  if (product.avgSales && product.avgSales > 0) {
    avgSales = product.avgSales;
  } else if (product.maxAvgSales > 0) {
    avgSales = Math.ceil(fbaInventorySales.sales * 0.4 + product.maxAvgSales * 0.6);
  } else {
    avgSales = Math.ceil(fbaInventorySales.sales);
  }
  var sales = {
    airExpress: (fbaInventorySales.sales * 0.9 + product.maxAvgSales * 0.1),
    airDelivery: (fbaInventorySales.sales * 0.8 + product.maxAvgSales * 0.2),
    seaExpress: avgSales,
    sea: avgSales,
    minAvgSales: avgSales,
    maxAvgSales: product.maxAvgSales
  };
  return sales;
}
exports.getSales = getSales;
exports.getPlanV2 = async function(asin) {
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);

  console.log(fbaInventorySales);
  var product = await getProductByAsin(asin);
  var stock = await prepareStock(product);
  var sales = await getSales(fbaInventorySales, product);
  console.log(sales);
  var inboundShippeds = product.inboundShippeds;
  var totalInventory = fbaInventorySales.inventory + stock;
  var quantity = await getQuantity(sales, totalInventory, product);
  console.log(quantity);
  if (quantity.boxes < 0) {
    console.log("Inventory is enough, do not need to purchase any more");
    return quantity;
  }
  var inbounds = await convertInboundShippedsDeliveryDueToPeroid(inboundShippeds);
  await addCurrentInventoryToInbounds(totalInventory, inbounds);
  var minTotalSalesPeriod =  totalInventory / sales.maxAvgSales;
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var orderDues = await getOrderDue(product, totalInventory, sales, await prepareFreight(FREIGHT, 7));
 
  console.log(orderDues);
  var deliveryDue = await getDeliveryDue(totalInventory, inboundShippeds, sales, inboundShippeds);
  console.log(deliveryDue);
  
  var producingsStatus = await checkProducingsCreated(orderDues, quantity, product, sales);
  console.log(producingsStatus);
  product.save(function(error){
    if (error) {
      logger.error(error);
    }
  })
  var plan = await bestPlanV4(quantity, product, await prepareFreight(FREIGHT, 7), sales, inbounds);
  var volumeWeightCheck = true;
  for (var type in plan) {
    if (plan[type].units > 0) {
      if (!checkVolumeWeight(product.box, type)) {
        volumeWeightCheck = false;
      }
    }
  }
  var purchase = {
    asin: asin,
    plan: plan,
    sales: sales,
    minTotalSalesPeriod: Math.ceil(minTotalSalesPeriod),
    maxTotalSalesPeriod: Math.ceil(maxTotalSalesPeriod),
    totalInventory: totalInventory,
    fbaInventory: fbaInventorySales.inventory,
    stock: stock,
    inboundShippeds: inboundShippeds,
    volumeWeightCheck: volumeWeightCheck,
    orderDues: orderDues,
    producingsStatus: producingsStatus,
    quantity: quantity,
    deliveryDue: deliveryDue,
    product: product
  }
  console.log(purchase);
  return(purchase);
}

async function convertProducingQtyIntoBox(producing, product) {
  if (product.unitsPerBox === 0) {
    product.unitsPerBox = 30;
  }
  var quantity = {
    boxes: Math.ceil(producing.quantity / product.unitsPerBox)
  }
  return quantity;
}
async function prepareFreight(freight, gap) {
  var newFreight = {};
  for (var type in freight) {
    newFreight[type] = {
      period: freight[type].period + gap,
      price: freight[type].price
    }
  }
  return newFreight;
}
exports.getProducingPlan = async function(asin, producingId) {
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);
  console.log(fbaInventorySales);
  var product = await getProductByAsin(asin);
  var stock = await prepareStock(product);
  var sales = await getSales(fbaInventorySales, product);
  await removeDeliveredInbounds(product);
  var inboundShippeds = product.inboundShippeds;
  var totalInventory = fbaInventorySales.inventory + stock;

  var inbounds = await convertInboundShippedsDeliveryDueToPeroid(inboundShippeds);
  await addCurrentInventoryToInbounds(totalInventory, inbounds);
  var plan = null;
  for (var producing of product.producings) {
    if (producing._id.toString() === producingId) {
      logger.debug(producing);
      plan = await getProducingFreightPlan(producing, product, await prepareFreight(FREIGHT, 7), sales, inbounds);
    }
  }
  logger.debug(plan);
  if (!plan) {
    console.log("can not find this producing");
    return "can not find this producing";
  }
  var minTotalSalesPeriod =  totalInventory / sales.maxAvgSales;
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var orderDues = await getOrderDue(product, totalInventory, sales, await prepareFreight(FREIGHT, 7), inboundShippeds)
 
  console.log(orderDues);
  var quantity = await getQuantity(sales, totalInventory, product, product.inboundShippeds, product.producings);
  console.log(product.asin, 'quantity done');
  if (quantity.boxes <= 0) {
    console.log("Inventory is enough, do not need to purchase any more");
    
  }
  var producingStatus = await checkProducingsCreated(orderDues, quantity, product, sales);
  console.log(producingStatus);
  var volumeWeightCheck = true;
  for (var type in plan) {
    if (plan[type].units > 0) {
      if (!checkVolumeWeight(product.box, type)) {
        volumeWeightCheck = false;
      }
    }
  }
  
  var purchase = {
    asin: asin,
    plan: plan,
    sales: sales,
    minTotalSalesPeriod: Math.ceil(minTotalSalesPeriod),
    maxTotalSalesPeriod: Math.ceil(maxTotalSalesPeriod),
    totalInventory: totalInventory,
    fbaInventory: fbaInventorySales.inventory,
    stock: stock,
    inboundShippeds: inboundShippeds,
    volumeWeightCheck: volumeWeightCheck,
    orderDues: orderDues,
    product: product
  }
  console.log(purchase);
  return(purchase);
}

async function bestProducingsFreightPlanForAllDelivery(producing, product, freight, sales, freightType, inbounds) {
  var quantity = await convertProducingQtyIntoBox(producing, product);
  var plan = {
    airExpress: {
      boxes: quantity.boxes
    },
    gap: 100000,
    minInventory: -100,
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight
  };
  for (var i = 1; i < freightType.length; i++) {
    plan[freightType[i]] = { boxes: 0 };
  }

  var freightPlan = {};
  var result = {
    plan: plan,
    status: "pending"
  }
  await getFreightPlanByProducing(freightPlan, quantity.boxes, 0, freightType, freight, inbounds, product, sales, result, producing);
  return await formatPlan(result.plan, product.unitsPerBox);
}

async function getProducingFreightPlan(producing, product, freight, sales, inbounds) {
  var freightType = ['airExpress', 'seaExpress'];
  if (product.airDelivery) {
    freightType = ['airExpress', 'airDelivery', 'seaExpress'];
  }
  if (product.sea) {
    freightType.push('sea');
  }
  return await bestProducingsFreightPlanForAllDelivery(producing, product, freight, sales, freightType, inbounds);
}

exports.getProducingFreightPlan = getProducingFreightPlan;
async function getOrderDue(product, totalInventory, sales, freight) {
  var freightType = ['airExpress', 'seaExpress', 'sea'];
  if (product.airDelivery) {
    freightType = ['airExpress', 'airDelivery', 'seaExpress', 'sea'];
  }
  var quantity = totalInventory;
  
  if (product.inboundShippeds) {
    for (var inbound of product.inboundShippeds) {
      var total = totalInventory;
      for (var fasterInbound of product.inboundShippeds) {
        if (moment(fasterInbound.deliveryDue).isBefore(inbound.deliveryDue)) {
          total += inbound.quantity;
        }
      }
      var delivery = moment(inbound.deliveryDue);
      if (total > sales.minAvgSales * (delivery.diff(moment(), "days") + 1)) {
        quantity += Number(inbound.quantity);
      }
    }
  }
  var orderDues = {};
  for (var type of freightType) {
    orderDues[type] = moment(moment().add(quantity / sales[type] - product.cycle - freight[type].period - GAP, 'days')).format('YYYY-MM-DD');
  }
  return orderDues;
}
exports.getOrderDue = getOrderDue;

async function checkProducingsCreated(orderDues, quantity, product, sales) {

  if (!product.producings) {
    return;
  }

  var freightType = ['airExpress', 'seaExpress', 'sea'];
  if (product.airDelivery) {
    freightType = ['airExpress', 'airDelivery', 'seaExpress', 'sea'];
  }
  
  for (var type of freightType) {
    var total = 0;
    for (var producing of product.producings) {
      if (moment(orderDues[type]).isAfter(moment(producing.created))) {
        total += producing.quantity;
      }
    }
    orderDues[type] = moment(moment(orderDues[type]).add(total / sales.minAvgSales, 'days')).format('YYYY-MM-DD');
  }
  var sum = 0;
  for (var producing of product.producings) { 
    sum += producing.quantity;
  }

  if (sum / quantity.quantity > 0.7) {
    return {
      placed: true,
      orderDues: orderDues
    }
  } else {
    return {
      placed: false,
      orderDues: orderDues
    }
  }
}
exports.checkProducingsCreated = checkProducingsCreated;
exports.getQuantity = getQuantity;
async function getQuantity(sales, totalInventory, product) {
  var total = totalInventory;
  if (product.inboundShippeds) {
    for (var inboundShipped of product.inboundShippeds) {
      var delivery = moment(inboundShipped.deliveryDue);
      if (delivery.diff(moment(), "days") + 1 <= 90) {
        total += Number(inboundShipped.quantity);
      }
    }
  }
  if (product.producings) {
    for (var producing of product.producings) {
      total += Number(producing.quantity);
    }
  }

  if (product.unitsPerBox === 0) {
    product.unitsPerBox = 30;
  }
  var boxes = Math.ceil((sales.minAvgSales * 90 - total) / product.unitsPerBox);

  if (boxes > 0) {
    var quantity = boxes * product.unitsPerBox;
    return {boxes: boxes, quantity: quantity};
  } else {
    var days = total / sales.maxAvgSales;
    return {boxes: boxes, days: days};
  }
}
async function getDeliveryDue(totalInventory, inboundShippeds, sales) {
  var due = totalInventory / sales.maxAvgSales;

  inboundShippeds = inboundShippeds.sort(function(m, n){ 
    return moment(m.deliveryDue).isBefore(n.deliveryDue)
  })

  for (var inbound of inboundShippeds) {
    var total = totalInventory;
    for (var fasterInbound of inboundShippeds) {
      if (moment(fasterInbound.deliveryDue).isBefore(inbound.deliveryDue)) {
        total += inbound.quantity;
      }
    }
    var delivery = moment(inbound.deliveryDue);
    if (total > sales.maxAvgSales * (delivery.diff(moment(), "days") + 1)) {
      total += inbound.quantity;
    }
    if (total / sales.maxAvgSales > due) {
      due = total / sales.maxAvgSales;
    } else {
      break;
    }
  }
  return moment(moment().add(due - GAP, 'days')).format('YYYY-MM-DD');
}

async function totalUnits(boxCount, unitsPerBox) {
  return boxCount * unitsPerBox;
}
async function calculatePlanAmounts(freightPlan, freight, product) {
  var amount = 0;
  for (var type in freightPlan) {
    freightPlan[type].amount = freightPlan[type].boxes * freight[type].price * product.box.weight;
    amount += freightPlan[type].amount;
  }
  freightPlan.totalAmount = amount;
  return freightPlan;
}


async function checkVolumeWeight(box, freightType) {
  if (freightType.indexOf('sea') > 0) {
    var volumeWeight = (box.length + box.width + box.height)  / 5000;
  } else {
    var volumeWeight = (box.length + box.width + box.height)  / 6000;
  }
  return (volumeWeight < 1.2 * box.wt);
}

async function formatPlan(plan, unitsPerBox) {
  for (var type in plan) {
    if (plan[type].boxes) {
      plan[type].units = plan[type].boxes * unitsPerBox;
    }
  }
  return plan;
}

async function calculatePlan(freightPlan, freightType, freight, inbounds, product, sales, result) {
  var newPlan = await getNewFreightPlan(freightPlan, freight, freightType, inbounds, product, sales);
  if (newPlan.minInventory >= product.minInventory) {
    if (newPlan.gap == 0) {
      result.plan = JSON.parse(JSON.stringify(newPlan));
      result.status = "done";
    } else if (newPlan.gap === result.plan.gap && Number(result.plan.totalAmount) >= Number(newPlan.totalAmount)) {
      result.plan = JSON.parse(JSON.stringify(newPlan));
    } else if (newPlan.gap < result.plan.gap) {
      result.plan = JSON.parse(JSON.stringify(newPlan));
    }
  } else if (newPlan.minInventory > result.plan.minInventory) {
    result.plan = JSON.parse(JSON.stringify(newPlan));  
  }
  return result;
}

async function checkMinInventory(minInventory, product) {
  for (var key in minInventory) {
    if (minInventory[key] < product.minInventory) {
      return false;
    }
  }
  return true;
}

async function calculateProducingPlan(freightPlan, freightType, freight, inbounds, product, sales, result, producing) {
  var newPlan = await getNewProducingFreightPlan(freightPlan, freight, freightType, product, sales, producing, inbounds);
  if (newPlan.minInventory >= product.minInventory) {
    if (newPlan.gap == 0) {
      result.plan = JSON.parse(JSON.stringify(newPlan));
      result.status = "done";
    } else if (newPlan.gap === result.plan.gap && (Number(result.plan.totalAmount) >= Number(newPlan.totalAmount) || result.plan.minInventory < product.minInventory)) {
      result.plan = JSON.parse(JSON.stringify(newPlan));
    } else if (newPlan.gap < result.plan.gap) {
      result.plan = JSON.parse(JSON.stringify(newPlan));
    }
  } else if (newPlan.gap < result.plan.gap) {
    result.plan = JSON.parse(JSON.stringify(newPlan));
  }
  logger.debug('freightPlan',freightPlan);
  logger.debug('result',result);
  return result;
}

async function getFreightPlan(freightPlan, left, index, freightType, freight, inbounds, product, sales, result) {
  if (result.status === "done") {
    return null;
  }
  if (index === freightType.length - 1) {
    freightPlan[freightType[index]] = { boxes: left };
    var freightPlanDup = JSON.parse(JSON.stringify(freightPlan));
    await calculatePlan(freightPlanDup, freightType, freight, inbounds, product, sales, result);
    if (result.status === "done") {
      return null;
    }
  } else {
    var i = 0;
    while(i <= left) {
      console.log('freightPlan', freightPlan);
      console.log('i', i);
      freightPlan[freightType[index]] = { boxes: i }
      await getFreightPlan(freightPlan, left - i, index + 1, freightType, freight, inbounds, product, sales, result);
      if ( i + 2 <= left ) {
        i+=2;
      } else {
        i++;
      }
    }
  }
}

async function getFreightPlanByProducing(freightPlan, left, index, freightType, freight, inbounds, product, sales, result, producing) {
  if (result.status === "done") {
    return null;
  }
  if (index === freightType.length - 1) {
    freightPlan[freightType[index]] = { boxes: left };
    var freightPlanDup = JSON.parse(JSON.stringify(freightPlan));
    await calculateProducingPlan(freightPlanDup, freightType, freight, inbounds, product, sales, result, producing);
    if (result.status === "done") {
      return null;
    }
  } else {
    var i = 0;
    while(i <= left) {
      freightPlan[freightType[index]] = { boxes: i };
      await getFreightPlanByProducing(freightPlan, left - i, index + 1, freightType, freight, inbounds, product, sales, result, producing);
      if ( i + 2 <= left ) {
        i+=2;
      } else {
        i++;
      }
    }
  }
}
async function bestPlanForAllDelivery(quantity, product, freight, sales, inbounds, freightType) {
  var plan = {
    airExpress: {
      boxes: quantity.boxes
    },
    gap: 100000,
    minInventory: 0,
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight
  };
  for (var i = 1; i < freightType.length; i++) {
    plan[freightType[i]] = { boxes: 0 };
  }

  var freightPlan = {};
  var result = {
    plan: plan,
    status: "pending"
  }
  await getFreightPlan(freightPlan, quantity.boxes, 0, freightType, freight, inbounds, product, sales, result)
  
  return await formatPlan(result.plan, product.unitsPerBox);
}

async function getNewFreightPlan(freightPlan, freight, freightType, inbounds, product, sales) {
  var newInbounds = await addFreightPlanToInbounds(freightPlan, freight, inbounds, product);
  newInbounds = await convertInboundsToSortedQueue(newInbounds);
  var inboundQueue = await calculateInboundQueue(newInbounds, sales);
  var status = await recalculateInboundQueue(inboundQueue, sales);
  var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
  newPlan.gap = await calculateOutOfStockPeriod(status);
  newPlan.minInventory = await calculateMinInventory(freight, freightType, status, sales, product);
  newPlan.inventoryStatus = status;
  return newPlan;
}

async function getNewProducingFreightPlan(freightPlan, freight, freightType, product, sales, producing, inbounds) {
  var newInbounds = await addProducingFreightPlanToInbounds(freightPlan, freight, inbounds, product, producing);
  newInbounds = await convertInboundsToSortedQueue(newInbounds);
  var inboundQueue = await calculateInboundQueue(newInbounds, sales);
  var status = await recalculateInboundQueue(inboundQueue, sales);
  logger.debug('recalculateInboundQueue', status);
  var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
  newPlan.gap = await calculateOutOfStockPeriod(status);
  newPlan.minInventory = await calculateProducingMinInventory(freight, freightType, status, sales, product, producing);
  newPlan.inventoryStatus = status;
  logger.debug('inventoryStatus', newPlan.inventoryStatus);
  return newPlan;
}

async function bestPlanV4(quantity, product, freight, sales, inbounds) {
  var freightType = ['airExpress', 'seaExpress'];
  if (product.airDelivery) {
    freightType = ['airExpress', 'airDelivery', 'seaExpress'];
  }

  if (product.sea) {
    freightType.push('sea');
  }

  return await bestPlanForAllDelivery(quantity, product, freight, sales, inbounds, freightType);
}

var getProductByAsin = async function (asin) {
  return Product.findOne({'asin': asin}).clone().catch(function(err){ console.log(err)});
};
exports.getProductByAsin = getProductByAsin;

exports.newAndSave = function (data, callback) {
  var product = new Product();
  product.asin = data.asin;
  product.cycle = data.cycle;
  product.unitsPerBox = data.unitsPerBox;
  product.box = data.box;
  product.maxAvgSales = data.maxAvgSales;
  product.plwhsId = data.plwhsId;
  product.yisucangId = data.yisucangId;
  product.minInventory = data.minInventory;
  console.log(product);
  product.save(callback);
};
exports.findAll = findAll;

var deleteInbound = async function(inboundId) {
  var objId = mongoose.Types.ObjectId(inboundId);
  await Product.update({"inboundShippeds._id": objId}, { $pull:{'inboundShippeds': {"_id": objId}}});
}
var deleteProducing = async function(producingId) {
  var objId = mongoose.Types.ObjectId(producingId);
  await Product.update({"producings._id": objId}, { $pull:{'producings': {"_id": objId}}});
}
var updateInbound = async function(inboundId, deliveryDue, quantity) {
  var objId = mongoose.Types.ObjectId(inboundId);
  await Product.updateOne({"inboundShippeds._id": objId}, { $set:{'inboundShippeds.$.deliveryDue': deliveryDue, 'inboundShippeds.$.quantity': quantity}});
}

async function updateProducing(producingId, deliveryDue, quantity) {
  var objId = mongoose.Types.ObjectId(producingId);
  await Product.updateOne({"producings._id":objId},{$set: {'producings.$.deliveryDue': deliveryDue, 'producings.$.quantity': quantity}});
}

var remove = async function(asin, productId) {
  if (asin) {
    await Product.deleteOne({"asin": asin});
  } else if (productId) {
    await Product.deleteOne({"_id": mongoose.Types.ObjectId(productId)});
  }
}
exports.updateProducing = updateProducing;
exports.deleteProducing = deleteProducing;
exports.updateInbound = updateInbound;
exports.deleteInbound = deleteInbound;
exports.remove = remove;
exports.prepareFbaInventoryAndSales = prepareFbaInventoryAndSales;