var models  = require('../models');
var Product = models.Product;
var mongoose = require('mongoose');
var moment = require('moment');
const GAP = 4;
var getFbaInventoryByASIN = require('../lib/getFbaInventoryByASIN')
var getStockByASIN = require('../lib/getStockByASIN');
const { ObjectId } = require('mongodb');

async function prepareStock(asin) {
  var stock = await getStockByASIN(asin);
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

exports.getPlan = async function(asin) {
  var fbaInventorySales = await prepareFbaInventoryAndSales(asin);
  console.log(fbaInventorySales);
  var stock = await prepareStock(asin);
  console.log(stock);
  var product = await getProductByAsin(asin);
  // var product = PRODUCTS[asin];
  var sales = {
    minAvgSales: Math.ceil(fbaInventorySales.sales),
    maxAvgSales: product.maxAvgSales
  };
  // var inboundShippeds = PRODUCTS[asin].inboundShippeds;
  var inboundShippeds = product.inboundShippeds;
  var totalInventory = fbaInventorySales.inventory + stock;
  var minTotalSalesPeriod =  totalInventory / sales.maxAvgSales;
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var seaFreightDue = await getOrderDue(product, 'sea', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(seaFreightDue);
  var seaExpressDue = await getOrderDue(product, 'seaExpress', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  console.log(seaExpressDue);
  // var allAirDeliveryDue = await getOrderDue(product, 'airDelivery', maxTotalSalesPeriod, totalInventory, sales, FREIGHT, inboundShippeds);
  // console.log(allAirDeliveryDue);
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
  var plan = await bestPlan(quantity, product, FREIGHT, totalInventory, sales, inboundShippeds);

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
    seaFreightDue: seaFreightDue,
    seaExpressDue: seaExpressDue,
    // allAirDeliveryDue: allAirDeliveryDue,
    airExpressDue: airExpressDue,
    quantity: quantity,
    deliveryDue: deliveryDue,
    product: product
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
  console.log(total);
  console.log(product);
  console.log(sales);
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
  if (freightPlan['sea']['boxes'] == 51) {
    console.log('amount')
    console.log(amount)
  }
  freightPlan.totalAmount = amount;
  return freightPlan;
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

async function formatPlan(plan, unitsPerBox, inventoryCheck) {
  for (var type in plan) {
    if (plan[type].boxes) {
      plan[type].units = plan[type].boxes * unitsPerBox;
    }
  }
  plan.inventoryCheck = inventoryCheck;
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
      for (var k = quantity.boxes - i - j; k >= 0; k--) {
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
            boxes: (quantity.boxes - i - j - k)
          }
        }
        checked = await checkFreightPlan(freightPlan, freight, product, totalInventory, sales, inboundShippeds)
        if (checked) {
          var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
          if (Number(plan.totalAmount) >= Number(newPlan.totalAmount)) {
            plan = newPlan;
            inventoryCheck = checked;
            return await formatPlan(plan, product.unitsPerBox, inventoryCheck);
          }
        }
      }
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
var remove = async function(asin) {
  await Product.deleteOne({"asin": asin})
}
exports.deleteInbound = deleteInbound;
exports.remove = remove;