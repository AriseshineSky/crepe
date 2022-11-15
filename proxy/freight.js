var Product = require('../proxy').Product;
var Csv = require('../proxy').Csv;
var sheetApi = require('./sheetApi');
var Purchase = require('./purchases');
var moment = require('moment');
var getStockByProduct = require('../lib/getStockByProduct');
const HEADER = ['pm', 'asin', 'plwhsId', 
'yisucangId', 'cycle', 
'maxAvgSales', 
'box.length', 'box.width', 'box.height', 'unitsPerBox', 'box.weight' ]
const PRODUCT_ATTR = ['asin', 'plwhsId', 
'yisucangId', 'cycle', 
'maxAvgSales', 'unitsPerBox']
const INBOUND_ATTR = ['deliveryDue', 'quantity']
class Freight {
  constructor() {
    this.freights = null;
  }
  static async getInstance() {
    if(!this.instance) {
      this.instance = new Freight();
      this.instance.freights = await syncFreights();
    }
    return this.instance;
  }
}

var syncFreights = async function() {
  var freights = [];
  var rows = await sheetApi.listFreights();
  
  var header = rows.shift();
  var deliveryDueIndex = header.indexOf("预计到港时间");
  var deliveryIndex = header.indexOf("状态");
  var orderIndex = header.indexOf("系统订单");
  var qtyIndex = header.indexOf("出货数量");
  var boxIndex = header.indexOf("装箱信息");

  for(var row of rows) {
    if (row.length > 3) {
      var freight = await parseRow(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex, boxIndex);
      freights.push(freight);
    }
  }
  return freights;
}

async function formatFreightsAndProductings(freightsAndProducings) {
  var inboundShippeds = [];
  var producings = [];
  for (var freight of freightsAndProducings.freights) {
    inboundShippeds.push({
      quantity: freight.qty,
      orderId: freight.orderId,
      deliveryDue: freight.delivery,
      box: freight.box
    });
  }
  for (var producing of freightsAndProducings.producings) {
    producings.push({
      orderId: producing.orderId,
      quantity: producing.qty,
      deliveryDue: producing.delivery
    });
  }
  return {
    inboundShippeds: inboundShippeds,
    producings: producings
  }
}

function compare(type) {
  return function(m, n) {
    return m[type] - n[type];
  }
}

async function sortFreightsByDelivery(freights) {
  return freights.sort(compare('delivery'))
}
var sumFreights = async function(freights) {
  var sum = 0;
  for (var freight of freights) {
    sum += freight.qty;
  }
  return sum;
}

var checkFreights = async function(freights, pendingStorageNumber) {
  freights = await sortFreightsByDelivery(freights);
  while ((await sumFreights(freights)) > pendingStorageNumber) {
    freights.shift;
  }
}

var getFreightsAndProductingsByProduct = async function(product) {
  var freights = [];
  var producings = [];
  // var allFreights = await syncFreights();
  const freightApi = await Freight.getInstance();
  var allFreights = freightApi.freights;
  var purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
  var lastestFreight = moment().subtract(1, 'year').format('YYYY-MM-DD');
  var lastestFreightOrderId = moment().subtract(1, 'year').format('YYYY-MM-DD');
  for (var i = 0; i < allFreights.length; i++) {
    if (moment(allFreights[i].delivery).isAfter(moment(lastestFreight))) {
      lastestFreight = allFreights[i].delivery;
      lastestFreightOrderId = allFreights[i].orderId;
    }
  }
  for (var j = 0; j < purchases.length; j++) {
    var unShippedAmount = purchases[j].qty;
    for (var i = 0; i < allFreights.length; i++) {
      if (allFreights[i].orderId === purchases[j].orderId) {
        unShippedAmount -= allFreights[i].qty;
        if (moment(allFreights[i].delivery).diff(moment(new Date()), 'days') > -10) {
          freights.push(allFreights[i]);
        }
      }
    }
    if ((unShippedAmount / purchases[j].qty) > 0.15 && moment(new Date()).diff(moment(purchases[j].created), 'days') < 60) {
    // if (!shipped && purchases[j].orderId > lastestFreightOrderId) {
    // if (!shipped && purchases[j].orderId > lastestFreightOrderId && moment(purchases[j].delivery).isAfter(moment.now())) {
      producings.push({
        orderId: purchases[j].orderId,
        qty: unShippedAmount,
        delivery: purchases[j].us_arrival_date
      });
    }
  }
  var stock = await getStockByProduct(product);
  if (stock.inventory !== 0) {
    await checkFreights(freights, stock.inventory.pendingStorageNumber);
  } else {
    await checkFreights(freights, 20000);
  }
  
  return await formatFreightsAndProductings({
    freights: freights,
    producings: producings
  })
}

var parseDate = async function(dateInfo) {
  if (dateInfo) {
    var re = /\d+月.*\d+号?/;
    var date = dateInfo.match(re);
    if (date) {
      return moment(date[0], 'MM月DD号');
    } else {
      console.log('err', dateInfo);
    }
  }
}

var parseOrderId = async function(orderId) {
  if (orderId) {
    var re = /OR\d*/;
    orderId = orderId.match(re);
    if (orderId) {
      return orderId[0];
    }
  }
}

var parseBox = async function(boxInfo) {
  boxInfo = "6箱，250/箱，14kg/箱，54*40*34cm"
  var box = {};
  if (boxInfo) {
    var diRe = /\d*(\*|\×)\d*(\*|\×)\d*/;
    var diStr = boxInfo.match(diRe);
    if (diStr[0]) {
      var di = diStr[0].split('*');
      box = {
        length: Number(di[0]),
        width: Number(di[1]),
        height: Number(di[2])
      }
    }

    var weightRe = /[\d\s\.]*(kg|KG)/;
    diStr = boxInfo.match(weightRe);
    if (diStr[0]) {
      box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
    }

    var unitsRe = /\d+(盒)?\/箱/;
    box.units = Number(boxInfo.match(unitsRe)[0].match(/[\d]+/)[0]);

    return box;
  }
}

var parseRow = async function(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex, boxIndex) {
  var delivery = null;
  if (row[deliveryIndex]) {
    delivery = await parseDate(row[deliveryIndex]);
  } else if (row[deliveryDueIndex]) {
    delivery = await parseDate(row[deliveryDueIndex]);
  }
  var orderId = await parseOrderId(row[orderIndex]);
  var box = await parseBox(row[boxIndex]);
  return {
    orderId: orderId,
    delivery: delivery,
    qty: row[qtyIndex],
    box: box
  }
}
module.exports.listFreights = syncFreights;
module.exports.getFreightsAndProductingsByProduct = getFreightsAndProductingsByProduct;


