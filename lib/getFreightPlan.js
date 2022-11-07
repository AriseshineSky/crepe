var moment = require('moment');
var getListingsByASIN = require('./getListingsByASIN');
const GAP = 4;
async function getProductInventorySalesByCountry(data) {
  return new Promise(async (resolve, reject)=>{
    var inventory = 0;
    var sales = 0;
    for(var account in data) {
      for(var listing of data[account]) {
        inventory = inventory + listing.availableQuantity + listing.reservedFCTransfer + listing.inboundShipped;
        sales = sales + listing.ps;
      } 
    }
    resolve({
      inventory: inventory,
      sales: sales
    })
  })
}

module.exports = async function(asin, country) {
  var listings = await getListingsByASIN(asin);
  var data = await getProductInventorySalesByCountry(listings[asin][country]);
  var maxTotalSalesPeriod =  totalInventory / sales.minAvgSales;
  var allSeaFreightDue = await getOrderDue(product, 'sea', maxTotalSalesPeriod, freight);
  var seaExpress = await getOrderDue(product, 'seaExpress', maxTotalSalesPeriod, freight);
  var allAirDelivery = await getOrderDue(product, 'airDelivery', maxTotalSalesPeriod, freight);
  var airExpress = await getOrderDue(product, 'airExpress', maxTotalSalesPeriod, freight);
  var quantity = await getQuantity(sales, totalInventory);
  var deliveryDue = await getDeliveryDue(minTotalSalesPeriod);

  var plan = await bestPlan(quantity, product, freight, totalInventory, sales);
  return(plan);
}

async function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}
async function getOrderDue(product, type, maxTotalSalesPeriod, freight) {
  var day = new Date();
  return day.setDate(day.getDate() + maxTotalSalesPeriod - product.cycle - freight[type].period);
}

async function getQuantity(sales, totalInventory) {
  var boxes = Math.ceil((sales.maxAvgSales * 90 - totalInventory) / 70);
  var quantity = boxes * 70;
  return {boxes: boxes, quantity: quantity};
}

async function getDeliveryDue(minTotalSalesPeriod) {
  var day = new Date();
  return day.setDate(day.getDate() + minTotalSalesPeriod - GAP);
}

async function calculatePlanAmounts(freightPlan, freight, product) {
  var amount = 0;
  for (var type in freightPlan) {
    freightPlan[type].amount = freightPlan[type].boxes * freight[type].price * product.box.weight;
    amount += freightPlan[type].amount;
  }
  freightPlan.totalAmount = amount;
  console.log(typeof(freightPlan.totalAmount));
  return freightPlan;
}

async function checkFreightPlan(freightPlan, freight, product, totalInventory, sales) {
  for (var type in freightPlan) {
    var boxCount = 0;
    for (var fasterType in freightPlan) {
      if (freight[fasterType].period < freight[type].period) {
        boxCount += freightPlan[fasterType].boxes;
      }
    }
    if (boxCount * product.unitsPerBox + totalInventory < sales.maxAvgSales * (product.cycle + freight[type].period + GAP)) {
      return false;
    }
  }
  return true;
}
async function bestPlan(quantity, product, freight, totalInventory, sales) {
  var plan = {
    totalAmount: 100000000
  };
  for (var i = 0; i <= quantity.boxes; i++) {
    for (var j = 0; j <= quantity.boxes - i; j++) {
      for (var k = 0; k <= quantity.boxes - i - j; k++) {
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
            boxes: (quantity.boxes - i - j - k)
          }
        }
        console.log('test');
        if (await checkFreightPlan(freightPlan, freight, product, totalInventory, sales)) {
          console.log(freightPlan);
          var newPlan = await calculatePlanAmounts(freightPlan, freight, product);
          console.log(newPlan);
          if (plan.totalAmount > newPlan.totalAmount) {
            plan = newPlan;
          }
        }
      }
    }
  }
  return plan;
}