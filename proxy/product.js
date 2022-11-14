var models  = require('../models');
var Product = models.Product;
var mongoose = require('mongoose');
var moment = require('moment');
const GAP = 4;
var getFbaInventoryByASIN = require('../lib/getFbaInventoryByASIN')
var getStockByProduct = require('../lib/getStockByProduct');
var Freight = require('./freight');
async function getFreight(product) {
  Freight.getFreightsAndProductingsByProduct(product);
}

async function syncFreight(product) {
  var freightsAndProducings = await Freight.getFreightsAndProductingsByProduct(product);
  product.inboundShippeds = freightsAndProducings.inboundShippeds;
  product.producings = freightsAndProducings.producings;
  product.save(function (err) {
    console.log(err);
  });
}

exports.syncFreight = syncFreight;
exports.getFreight = getFreight;
async function checkStatus(inbound, units, sales) {
  return(units - inbound.period * sales.minAvgSales);
}

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
  for (var j = 1; j < freightType.length; j++) {
    for (var i = 0; i < status.length; i++) {
      var type = freightType[j];
      if (status[i].period === freight[type].period + product.cycle) {
        period = Math.floor(status[i].before / sales.minAvgSales);
        if (period < minInventory) {
          minInventory = period;
        }
      }
    }
  }
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
  console.log(newInboundQueue);
  console.log(states);
  return states;
}

async function checkInboundQueue(inboundQueue) {
  var sum = 0;
  for(var i = 0; i < inboundQueue.length; i++) {
    if (inboundQueue[i].inventory.before < 0) {
      sum -= inboundQueue[i].inventory.before;
    } 
  }
  return sum;
}

async function convertDeliveryDueToPeroid(inbound) {
  var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
  return(delivery.diff(moment(), "days") + 1);
}

async function convertInboundShippedsDeliveryDueToPeroid(inboundShippeds) {
  var inbounds = [];
  inboundShippeds.forEach(async function(inbound) {
    inbound.period = await convertDeliveryDueToPeroid(inbound);
    inbounds.push({
      period: inbound.period,
      quantity: inbound.quantity
    });
  })
  return inbounds;
}

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
  console.log(newInbounds);
  newInbounds.push({
    quantity: shipment.quantity,
    period: shipment.period
  })
  return newInbounds;
}

async function addFreightPlanToInbounds(freightPlan, freight, inbounds, product) {
  var newInbounds = JSON.parse(JSON.stringify(inbounds));
  for(var type in freightPlan) {
    if (freightPlan[type].boxes > 0) {
      var shipment = {
        quantity: await totalUnits(freightPlan[type].boxes, product.unitsPerBox),
        period: product.cycle + freight[type].period
      }
      console.log(shipment)
      newInbounds = await addShipmentToInbounds(shipment, newInbounds)
    }
  }
  return newInbounds;
}

async function prepareStock(product) {
  var stock = await getStockByProduct(product);
  console.log('stock', stock);
  if (stock.inventory) {
    return stock.inventory.SumNumber;
  } else {
    return 0;
  }
}

var findAll = async function() {
  return Product.find({});
}

async function prepareFbaInventoryAndSales(asin) {
  var inventory = 0;
  var sales = 0;
  var listings = await getFbaInventoryByASIN(asin);
  for(var country in listings[asin]) {
    for(var account in listings[asin][country]) {
      for(var listing of listings[asin][country][account]) {
        inventory = inventory + listing.availableQuantity + listing.reservedFCTransfer + listing.inboundShipped;
        sales = sales + listing.ps;
      }
    }
  }
  console.log(JSON.stringify(listings));
  return {
    inventory: inventory,
    sales: sales
  }
}

async function checkInventoryWithInbounds(product, freight, totalInventory, sales, inboundShippeds) {
  var airDeliveryDue = product.cycle + freight.airExpress.period + GAP;
  var units = 0;
  var inventoryCheck = true;
  for (var inbound of inboundShippeds) {
    units += Number(inbound.quantity);
  }
  if (airDeliveryDue * sales.minAvgSales > units + totalInventory) {
    inventoryCheck = false;
  }
  return {
    period: Math.floor((units + totalInventory) / sales.minAvgSales),
    inventoryCheck: inventoryCheck
  }
}

async function checkInbounds(totalInventory, sales, inboundShippeds) {
  var data = [];
  var checked = true;
  inboundShippeds = inboundShippeds.sort(function(m, n){ 
    return moment(m.deliveryDue).isBefore(n.deliveryDue)
  })

  var gapItems = 0;
  for (var inbound of inboundShippeds) {
    var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
    var period = delivery.diff(moment(), "days") + 1;
    var units = 0;

    for (var fasterInbound of inboundShippeds) {
      var fasterDelivery = moment(fasterInbound.deliveryDue, "YYYY-MM-DD");
      var lessPeriod = fasterDelivery.diff(moment(), "days") + 1;
      if (lessPeriod < period) {
        units += Number(fasterInbound.quantity);
      }
    }

    var leftItems = units + totalInventory + gapItems - period * sales.minAvgSales;
    if (leftItems < 0) {
      checked = false;
      console.log("gapItems");
      console.log(gapItems);
      console.log(Math.floor((units + totalInventory + gapItems) / sales.minAvgSales));
      data[Math.floor((units + totalInventory + gapItems) / sales.minAvgSales)] = {
        before: 0,
        after: 0
      }
      data[period] = {
        before: 0,
        after: Number(inbound.quantity)
      } 
      gapItems -= leftItems;
    } else {
      data[period] = {
        before: gapItems + units + totalInventory - period * sales.minAvgSales,
        after: (gapItems + units + Number(inbound.quantity) + totalInventory - period * sales.minAvgSales)
      }
    }
  }
  return {
    checked: checked,
    data: data
  }
}

async function removeDeliveredInbounds(product) {
  product.inboundShippeds.forEach(async function(inbound) {
    if (moment(inbound.deliveryDue).isBefore(moment.now())) {
      await Product.update({"inboundShippeds._id": inbound._id}, { $pull:{'inboundShippeds': {"_id": inbound._id}}})
    }
  });
}

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

async function checkInboundShippeds(product) {
  var freightsAndProducings = await Freight.getFreightsAndProductingsByProduct(product);
  product.inboundShippeds = freightsAndProducings.inboundShippeds;
  product.producings = freightsAndProducings.producings;
  product.save(function (err) {
    console.log(err);
  });
}

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
  var sales = {
    minAvgSales: Math.ceil(fbaInventorySales.sales),
    maxAvgSales: product.maxAvgSales
  };
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

exports.getPlanV2 = async function(asin) {
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);
  console.log(fbaInventorySales);
  var product = await getProductByAsin(asin);
  // var product = PRODUCTS[asin];
  var stock = await prepareStock(product);
  console.log(stock);
  var sales = {
    minAvgSales: Math.ceil(fbaInventorySales.sales),
    maxAvgSales: product.maxAvgSales
  };
  // var sales = {
  //   minAvgSales: product.maxAvgSales,
  //   maxAvgSales: product.maxAvgSales
  // };
  console.log(product.inboundShippeds);
  await removeDeliveredInbounds(product);
  var inboundShippeds = product.inboundShippeds;
  var totalInventory = fbaInventorySales.inventory + stock;
  var quantity = await getQuantity(sales, totalInventory, product, inboundShippeds);
  console.log(quantity);
  if (quantity.boxes < 0) {
    console.log("Inventory is enough, do not need to purchase any more");
    return quantity;
  }

  var inbounds = await convertInboundShippedsDeliveryDueToPeroid(inboundShippeds);
  console.log("inbound")
  console.log(inbounds)
  await addCurrentInventoryToInbounds(totalInventory, inbounds);
  console.log(inbounds)
  var plan = await bestPlanV4(quantity, product, FREIGHT, sales, inbounds);
  
  
  var minTotalSalesPeriod =  totalInventory / sales.maxAvgSales;
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var seaFreightDue = await getOrderDue(product, 'sea', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(seaFreightDue);
  var seaExpressDue = await getOrderDue(product, 'seaExpress', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(seaExpressDue);
  if (product.airDelivery) {
    var allAirDeliveryDue = await getOrderDue(product, 'airDelivery', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
    console.log(allAirDeliveryDue);
  }
  var airExpressDue = await getOrderDue(product, 'airExpress', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(airExpressDue);
  var quantity = await getQuantity(sales, totalInventory, product, inboundShippeds);
  console.log(quantity);
 
  var deliveryDue = await getDeliveryDue(totalInventory, inboundShippeds, sales, inboundShippeds);
  console.log(deliveryDue);
  var volumeWeightCheck = true;
  for (var type in plan) {
    if (plan[type].units > 0) {
      if (!checkVolumeWeight(product.box, type)) {
        volumeWeightCheck = false;
      }
    }
  }

  if (product.airDelivery) {
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
      seaFreightDue: seaFreightDue,
      seaExpressDue: seaExpressDue,
      allAirDeliveryDue: allAirDeliveryDue,
      airExpressDue: airExpressDue,
      quantity: quantity,
      deliveryDue: deliveryDue,
      product: product
    }
  } else {
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
      seaFreightDue: seaFreightDue,
      seaExpressDue: seaExpressDue,
      airExpressDue: airExpressDue,
      quantity: quantity,
      deliveryDue: deliveryDue,
      product: product
    }
  }
  
  console.log(purchase);
  return(purchase);
}
exports.getPlan = async function(asin) {
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);
  console.log(fbaInventorySales);
  var product = await getProductByAsin(asin);
  // var product = PRODUCTS[asin];
  var stock = await prepareStock(product);
  console.log(stock);
  var sales = {
    minAvgSales: Math.ceil(fbaInventorySales.sales),
    maxAvgSales: product.maxAvgSales
  };
  var inboundShippeds = product.inboundShippeds;
  var totalInventory = fbaInventorySales.inventory + stock;
  var minTotalSalesPeriod =  totalInventory / sales.maxAvgSales;
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var seaFreightDue = await getOrderDue(product, 'sea', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(seaFreightDue);
  var seaExpressDue = await getOrderDue(product, 'seaExpress', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(seaExpressDue);
  if (product.airDelivery) {
    var allAirDeliveryDue = await getOrderDue(product, 'airDelivery', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
    console.log(allAirDeliveryDue);
  }
  var airExpressDue = await getOrderDue(product, 'airExpress', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(airExpressDue);
  var quantity = await getQuantity(sales, totalInventory, product, inboundShippeds);
  console.log(quantity);
  if (quantity.boxes < 0) {
    console.log("Inventory is enough, do not need to purchase any more");
    return quantity;
  }
  var deliveryDue = await getDeliveryDue(totalInventory, inboundShippeds, sales, inboundShippeds);
  console.log(deliveryDue);

  await addInboundsToQueue(totalInventory, sales, inboundShippeds);

  var inventoryInfo = await checkInventoryWithInbounds(product, FREIGHT, totalInventory, sales, inboundShippeds)
  var inboundsInfo = await checkInbounds(totalInventory, sales, inboundShippeds);
  
  if (!inventoryInfo.inventoryCheck) {
    console.log("inventory is not enough");
    var plan = await bestPlanV3(quantity, product, FREIGHT, sales);
    if (inventoryInfo.period < product.cycle + FREIGHT["airExpress"].period) {
      plan.inventoryCheck[inventoryInfo.period] = {
        before: 0,
        after: 0
      }
    }
  } else if (inboundsInfo.checked) {
    console.log("inbound is good");
    var plan = await bestPlan(quantity, product, FREIGHT, totalInventory, sales, inboundShippeds);
  } else {
    console.log("inbound is not good");
  }

  var volumeWeightCheck = true;
  for (var type in plan) {
    if (plan[type].units > 0) {
      if (!checkVolumeWeight(product.box, type)) {
        volumeWeightCheck = false;
      }
    }
  }

  if (product.airDelivery) {
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
      seaFreightDue: seaFreightDue,
      seaExpressDue: seaExpressDue,
      allAirDeliveryDue: allAirDeliveryDue,
      airExpressDue: airExpressDue,
      quantity: quantity,
      deliveryDue: deliveryDue,
      product: product
    }
  } else {
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
      seaFreightDue: seaFreightDue,
      seaExpressDue: seaExpressDue,
      // allAirDeliveryDue: allAirDeliveryDue,
      airExpressDue: airExpressDue,
      quantity: quantity,
      deliveryDue: deliveryDue,
      product: product
    }
  }
  
  console.log(purchase);
  return(purchase);
}

async function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}
async function getOrderDue(product, type, maxTotalSalesPeriod, totalInventory, sales, freight, inboundShippeds) {
  var quantity = totalInventory;
  var day = new Date();
  
  for (var inbound of inboundShippeds) {
    var total = totalInventory;
    for (var fasterInbound of inboundShippeds) {
      if (moment(fasterInbound.deliveryDue).isBefore(inbound.deliveryDue)) {
        total += inbound.quantity;
      }
    }
    var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
    if (total > sales.minAvgSales * (delivery.diff(moment(), "days") + 1)) {
      quantity += Number(inbound.quantity);
    }
  }

  return moment(moment().add(quantity / sales.minAvgSales - product.cycle - freight[type].period - GAP, 'days')).format('YYYY-MM-DD');
}

async function getQuantity(sales, totalInventory, product, inboundShippeds) {
  var total = totalInventory;
  inboundShippeds.forEach(function(inboundShipped) {
    var delivery = moment(inboundShipped.deliveryDue, "YYYY-MM-DD");
    if (delivery.diff(moment(), "days") + 1 <= 90) {
      total += Number(inboundShipped.quantity);
    }
  })
  var boxes = Math.ceil((sales.maxAvgSales * 90 - total) / product.unitsPerBox);
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
    var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
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
async function getInventoryByDate(freightPlan, freight, product, totalInventory, sales, inboundShippeds) {
  var data = [];
  for (var inbound of inboundShippeds) {
    var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
    var period = delivery.diff(moment(), "days") + 1;
    var units = 0;

    for (var fasterInbound of inboundShippeds) {
      var fasterDelivery = moment(fasterInbound.deliveryDue, "YYYY-MM-DD");
      var lessPeriod = fasterDelivery.diff(moment(), "days") + 1;
      if (lessPeriod < period) {
        units += Number(fasterInbound.quantity);
      }
    }
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && (freight[fasterType].period + product.cycle) < period) {
        units += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }
 
    data[period] = {
      before: units + totalInventory - period * sales.minAvgSales,
      after: (units + Number(inbound.quantity) + totalInventory - period * sales.minAvgSales)
    }   
  }
  for (var type in freightPlan) {
    var quantity = 0;
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && freight[fasterType].period < freight[type].period) {
        quantity += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }

    for (var inbound of inboundShippeds) {
      var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
      if (delivery.diff(moment(), "days") + 1 < freight[type].period + product.cycle) {
        quantity += Number(inbound.quantity);
      } 
    }
    data[freight[type].period + product.cycle] = {
      before: quantity + totalInventory - (freight[type].period + product.cycle) * sales.minAvgSales,
      after: (quantity + await totalUnits(freightPlan[type].boxes, product.unitsPerBox) + totalInventory - (freight[type].period + product.cycle) * sales.minAvgSales)
    }
  }
  return data;
}
async function checkInventory(freightPlan, freight, product, totalInventory, sales, inboundShippeds) {
  var data = [];
  for (var inbound of inboundShippeds) {
    var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
    var period = delivery.diff(moment(), "days") + 1;
    var units = 0;

    for (var fasterInbound of inboundShippeds) {
      var fasterDelivery = moment(fasterInbound.deliveryDue, "YYYY-MM-DD");
      var lessPeriod = fasterDelivery.diff(moment(), "days") + 1;
      if (lessPeriod < period) {
        units += Number(fasterInbound.quantity);
      }
    }
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && (freight[fasterType].period + product.cycle) < period) {
        units += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }
    if (units + totalInventory - period * sales.minAvgSales < 0) {
      return false;
    }  
    data[period] = {
      before: units + totalInventory - period * sales.minAvgSales,
      after: (units + Number(inbound.quantity) + totalInventory - period * sales.minAvgSales)
    }   
  }
  for (var type in freightPlan) {
    var quantity = 0;
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && freight[fasterType].period < freight[type].period) {
        quantity += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }

    for (var inbound of inboundShippeds) {
      var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
      if (delivery.diff(moment(), "days") + 1 < freight[type].period + product.cycle) {
        quantity += Number(inbound.quantity);
      } 
    }
    if (quantity + totalInventory - (freight[type].period + product.cycle) * sales.minAvgSales < sales.minAvgSales * 10) {
      return false;
    }  
    data[freight[type].period + product.cycle] = {
      before: quantity + totalInventory - (freight[type].period + product.cycle) * sales.minAvgSales,
      after: (quantity + await totalUnits(freightPlan[type].boxes, product.unitsPerBox) + totalInventory - (freight[type].period + product.cycle) * sales.minAvgSales)
    }
  }
  return data;
}

async function checkInventoryAfterAir(freightPlan, freight, product, totalInventory, sales, inboundShippeds) {
  var data = [];
  for (var inbound of inboundShippeds) {
    var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
    var period = delivery.diff(moment(), "days") + 1;

    if (period < freightPlan['airExpress'].period + product.cycle) {
      continue;
    }
    var units = 0;

    for (var fasterInbound of inboundShippeds) {
      var fasterDelivery = moment(fasterInbound.deliveryDue, "YYYY-MM-DD");
      var lessPeriod = fasterDelivery.diff(moment(), "days") + 1;
      if (freightPlan['airExpress'].period + product.cycle < lessPeriod < period) {
        units += Number(fasterInbound.quantity);
      }
    }
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && (freight[fasterType].period + product.cycle) < period) {
        units += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }
    if (units - (period - freightPlan['airExpress'].period) * sales.minAvgSales < 0) {
      return false;
    }  
    data[period] = {
      before: units - (period - freightPlan['airExpress'].period) * sales.minAvgSales,
      after: (units + Number(inbound.quantity) - (period - freightPlan['airExpress'].period) * sales.minAvgSales)
    }   
  }
  for (var type in freightPlan) {
    if (type === 'airExpress') {
      data[freight[type].period + product.cycle] = {
        before: 0,
        after: (await totalUnits(freightPlan[type].boxes, product.unitsPerBox))
      }
      continue;
    }
    var quantity = 0;
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && freight[fasterType].period < freight[type].period) {
        quantity += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }

    for (var inbound of inboundShippeds) {
      var delivery = moment(inbound.deliveryDue, "YYYY-MM-DD");
      if (freight['airExpress'].period + product.cycle < delivery.diff(moment(), "days") + 1 < freight[type].period + product.cycle) {
        quantity += Number(inbound.quantity);
      } 
    }
    if (quantity - (freight[type].period +  - freight['airExpress'].period) * sales.minAvgSales < sales.minAvgSales * 10) {
      return false;
    }  
    data[freight[type].period + product.cycle] = {
      before: quantity - (freight[type].period - freight['airExpress'].period) * sales.minAvgSales,
      after: (quantity + await totalUnits(freightPlan[type].boxes, product.unitsPerBox) - (freight[type].period - freight['airExpress'].period) * sales.minAvgSales)
    }
  }
  return data;
}
async function checkInventoryAfterAirV3(freightPlan, freight, product, sales) {
  var data = [];
  for (var type in freightPlan) {
    if (type === 'airExpress') {
      data[freight[type].period + product.cycle] = {
        before: 0,
        after: (await totalUnits(freightPlan[type].boxes, product.unitsPerBox))
      }
      continue;
    }
    var quantity = 0;
    for (var fasterType in freightPlan) {
      if (freightPlan[fasterType].boxes && freight[fasterType].period < freight[type].period) {
        quantity += await totalUnits(freightPlan[fasterType].boxes, product.unitsPerBox);
      }
    }

    if (quantity - (freight[type].period - freight['airExpress'].period) * sales.minAvgSales < sales.minAvgSales * 10) {
      return false;
    }  
    data[freight[type].period + product.cycle] = {
      before: quantity - (freight[type].period - freight['airExpress'].period) * sales.minAvgSales,
      after: (quantity + await totalUnits(freightPlan[type].boxes, product.unitsPerBox) - (freight[type].period - freight['airExpress'].period) * sales.minAvgSales)
    }
  }
  return data;
}
async function checkFreightPlan(freightPlan, freight, product, totalInventory, sales, inboundShippeds) {
  return await checkInventory(freightPlan, freight, product, totalInventory, sales, inboundShippeds)
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
async function bestPlan(quantity, product, freight, totalInventory, sales, inboundShippeds) {
  var inventoryCheck = [];
  var checked = null;
  var plan = {
    sea: {
      boxes: 0
    },
    seaExpress: {
      boxes: 0
    },
    // airDelivery: {
    //   boxes: 0
    // },
    airExpress: {
      boxes: quantity.boxes
    },
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight
  };
  for (var i = quantity.boxes; i >= 0; i--) {
    for (var j = quantity.boxes - i; j >= 0; j--) {
      // for (var k = quantity.boxes - i - j; k >= 0; k--) {
        freightPlan = {
          sea: {
            boxes: i
          },
          seaExpress: {
            boxes: j
          },
          // airDelivery: {
          //   boxes: k
          // },
          airExpress: {
            boxes: (quantity.boxes - i - j)
          }
        }
        inventoryCheck = await getInventoryByDate(freightPlan, freight, product, totalInventory, sales, inboundShippeds)
        checked = await checkFreightPlan(freightPlan, freight, product, totalInventory, sales, inboundShippeds)
        if (checked) {
          var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
          if (Number(plan.totalAmount) >= Number(newPlan.totalAmount)) {
            plan = newPlan;
            inventoryCheck = checked;
            return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
          }
        }
      // }
    }
  }
  return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
}

async function bestPlanWithAirDelivery(quantity, product, freight, sales, inbounds, freightType) {
  var plan = {
    sea: {
      boxes: 0
    },
    seaExpress: {
      boxes: 0
    },
    airDelivery: {
      boxes: 0
    },
    airExpress: {
      boxes: quantity.boxes
    },
    gap: 100000,
    minInventory: 0,
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight
  };
  for (var i = quantity.boxes; i >= 0; i--) {
    for (var j = quantity.boxes - i; j >= 0; j--) {
      for (var k = quantity.boxes - i - j; k >= 0; k--) {
        freightPlan = {
          sea: {
            boxes: i
          },
          seaExpress: {
            boxes: j
          },
          airDelivery: {
            boxes: k
          },
          airExpress: {
            boxes: (quantity.boxes - i - j -k)
          }
        }
        var newPlan = await getNewFreightPlan(freightPlan, freight, freightType, inbounds, product, sales);
        if (newPlan.minInventory >= product.minInventory) {
          if (newPlan.gap == 0) {
            plan = JSON.parse(JSON.stringify(newPlan));
            return await formatPlan(plan, product.unitsPerBox);
          } else if (newPlan.gap === plan.gap && Number(plan.totalAmount) >= Number(newPlan.totalAmount)) {
            plan = JSON.parse(JSON.stringify(newPlan));
          } else if (newPlan.gap < plan.gap) {
            plan = JSON.parse(JSON.stringify(newPlan));
          }
        } else if (newPlan.minInventory >= plan.minInventory) {
          plan = JSON.parse(JSON.stringify(newPlan));  
        }
      }
    }
  }
  return await formatPlan(plan, product.unitsPerBox);
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
async function bestPlanWithoutAirDelivery(quantity, product, freight, sales, inbounds, freightType) {
  var plan = {
    sea: {
      boxes: 0
    },
    seaExpress: {
      boxes: 0
    },
    airExpress: {
      boxes: quantity.boxes
    },
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight,
    gap: 100000,
    minInventory: 0
  };
  for (var i = quantity.boxes; i >= 0; i--) {
    for (var j = quantity.boxes - i; j >= 0; j--) {
      freightPlan = {
        sea: {
          boxes: i
        },
        seaExpress: {
          boxes: j
        },
        airExpress: {
          boxes: (quantity.boxes - i - j)
        }
      }
      var newPlan = await getNewFreightPlan(freightPlan, freight, freightType, inbounds, product, sales);
      if (newPlan.minInventory >= product.minInventory) {
        if (newPlan.gap == 0) {
          plan = JSON.parse(JSON.stringify(newPlan));
          return await formatPlan(plan, product.unitsPerBox);
        } else if (newPlan.gap === plan.gap && Number(plan.totalAmount) > Number(newPlan.totalAmount)) {
          plan = JSON.parse(JSON.stringify(newPlan));
        } else if (newPlan.gap < plan.gap) {
          plan = JSON.parse(JSON.stringify(newPlan));
        }
      } else if (newPlan.minInventory >= plan.minInventory) {
        plan = JSON.parse(JSON.stringify(newPlan));  
      }
    }
  }
  return await formatPlan(plan, product.unitsPerBox);
}
async function bestPlanV4(quantity, product, freight, sales, inbounds) {
  var freightType = ['sea', 'seaExpress', 'airExpress']
  if (product.airDelivery) {
    freightType.push('airDelivery');
    return await bestPlanWithAirDelivery(quantity, product, freight, sales, inbounds, freightType);
  } else {
    return await bestPlanWithoutAirDelivery(quantity, product, freight, sales, inbounds, freightType);
  }
}

async function bestPlanV3(quantity, product, freight, sales) {
  var inventoryCheck = [];
  var checked = null;
  var plan = {
    sea: {
      boxes: 0
    },
    seaExpress: {
      boxes: 0
    },
    // airDelivery: {
    //   boxes: 0
    // },
    airExpress: {
      boxes: quantity.boxes
    },
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight
  };
  for (var i = quantity.boxes; i >= 0; i--) {
    for (var j = quantity.boxes - i; j >= 0; j--) {
      // for (var k = quantity.boxes - i - j; k >= 0; k--) {
        freightPlan = {
          sea: {
            boxes: i
          },
          seaExpress: {
            boxes: j
          },
          // airDelivery: {
          //   boxes: k
          // },
          airExpress: {
            boxes: (quantity.boxes - i - j)
          }
        }
        if (quantity.boxes - i - j > 0) {
          checked = await checkInventoryAfterAirV3(freightPlan, freight, product, sales)
          if (checked) {
            var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
            if (Number(plan.totalAmount) >= Number(newPlan.totalAmount)) {
              plan = newPlan;
              inventoryCheck = checked;
              return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
            }
          }
        }
      // }
    }
  }
  return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
}

async function bestPlanV2(quantity, product, freight, totalInventory, sales, inboundShippeds) {
  var inventoryCheck = [];
  var checked = null;
  var plan = {
    sea: {
      boxes: 0
    },
    seaExpress: {
      boxes: 0
    },
    // airDelivery: {
    //   boxes: 0
    // },
    airExpress: {
      boxes: quantity.boxes
    },
    totalAmount: quantity.boxes * freight.airExpress.price * product.box.weight
  };
  for (var i = quantity.boxes; i >= 0; i--) {
    for (var j = quantity.boxes - i; j >= 0; j--) {
      // for (var k = quantity.boxes - i - j; k >= 0; k--) {
        freightPlan = {
          sea: {
            boxes: i
          },
          seaExpress: {
            boxes: j
          },
          // airDelivery: {
          //   boxes: k
          // },
          airExpress: {
            boxes: (quantity.boxes - i - j)
          }
        }
        if (quantity.boxes - i - j > 0) {
          checked = await checkInventoryAfterAir(freightPlan, freight, product, totalInventory, sales, inboundShippeds)
          if (checked) {
            var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
            if (Number(plan.totalAmount) >= Number(newPlan.totalAmount)) {
              plan = newPlan;
              inventoryCheck = checked;
              return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
            }
          }
        }
      // }
    }
  }
  return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
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
  await Product.update({"inboundShippeds._id": objId}, { $pull:{'inboundShippeds': {"_id": objId}}})
}
var remove = async function(asin, productId) {
  if (asin) {
    await Product.deleteOne({"asin": asin})
  } else if (productId) {
    await Product.deleteOne({"_id": mongoose.Types.ObjectId(productId)})
  }
}
exports.deleteInbound = deleteInbound;
exports.remove = remove;