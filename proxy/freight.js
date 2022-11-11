var Product = require('../proxy').Product;
var Csv = require('../proxy').Csv;
var sheetApi = require('./sheetApi');
var Purchase = require('./purchases');
var moment = require('moment');
const HEADER = ['pm', 'asin', 'plwhsId', 
'yisucangId', 'cycle', 
'maxAvgSales', 
'box.length', 'box.width', 'box.height', 'unitsPerBox', 'box.weight' ]
const PRODUCT_ATTR = ['asin', 'plwhsId', 
'yisucangId', 'cycle', 
'maxAvgSales', 'unitsPerBox']
const INBOUND_ATTR = ['deliveryDue', 'quantity']
var syncFreights = async function() {
  var freights = [];
  var rows = await sheetApi.listFreights();
  
  var header = rows.shift();
  var deliveryDueIndex = header.indexOf("预计到港时间");
  var deliveryIndex = header.indexOf("状态");
  var orderIndex = header.indexOf("系统订单");
  var qtyIndex = header.indexOf("出货数量");

  for(var row of rows) {
    if (row.length > 3) {
      var freight = await parseRow(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex);
      freights.push(freight);
    }
  }
  return freights;
}

var getFreightsByProduct = async function(product) {
  var freights = [];
  var allFreights = await syncFreights();
  var purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
  for (var i = 0; i < allFreights.length; i++) {
    for (var j = 0; j < purchases.length; j++) {
      if (allFreights[i].orderId === purchases[j].orderId) {
        freights.push(allFreights[i]);
      }
    }
  }
  return freights;
}

var parseDate = async function(date) {
  if (date) {
    var re = /\d*月.*\d号/;
    date = date.match(re);
    return moment(date[0], 'MM月DD号');
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

var parseRow = async function(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex) {
  var delivery = null;
  if (row[deliveryIndex]) { 
    delivery = await parseDate(row[deliveryIndex]);
  } else if (row[deliveryDueIndex]) {
    delivery = await parseDate(row[deliveryDueIndex]);
  }
  var orderId = await parseOrderId(row[orderIndex]);
  return {
    orderId: orderId,
    delivery: delivery,
    qty: row[qtyIndex]
  }
}
module.exports.listFreights = syncFreights;
module.exports.getFreightsByProduct = getFreightsByProduct;


