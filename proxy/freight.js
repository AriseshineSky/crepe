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
  var boxIndex = header.indexOf("装箱信息");

  for(var row of rows) {
    if (row.length > 3) {
      var freight = await parseRow(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex, boxIndex);
      freights.push(freight);
    }
  }
  return freights;
}

var getFreightsAndProductingsByProduct = async function(product) {
  var freights = [];
  var producings = [];
  var allFreights = await syncFreights();
  var purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
  for (var j = 0; j < purchases.length; j++) {
    var shipped = false;
    for (var i = 0; i < allFreights.length; i++) {
      if (allFreights[i].orderId === purchases[j].orderId) {
        freights.push(allFreights[i]);
        shipped = true;
      }
    }
    if (!shipped) {
      producings.push(purchases[j]);
    }
  }
  return {
    freights: freights,
    producings: producings
  }
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

var parseBox = async function(boxInfo) {
  10箱，100/箱，10.6kg/箱，44*35*22cm
  var boxInfo = "2箱，200盒/箱，8.00 KG/箱，44×28×27cm"

  box: { 
    length: {type: Number, default: 0 },
    width: {type: Number, default: 0 },
    height: {type: Number, default: 0 },
    weight: {type: Number, default: 0 }
  },

  if (boxInfo) {
    var diRe = /\d*\*\d*\*\d*/;
    var diReV2 = /\d*\×\d*\×\d*/;
    var diStr = boxInfo.match(diRe);
    if (!diStr) {
      diStr = boxInfo.match(diReV2);
    }
    if (diStr) {
      var di = diStr.split('*');
      var box = {
        length: di[0],
        width: di[1],
        height: di[2]
      }
    }

    var weightRe = /[\d\s]*kg/;
    var weightReV2 = /[\d\s]*KG/;
    diStr = boxInfo.match(weightRe);
    diStr = boxInfo.match(weightReV2);

    
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
  return {
    orderId: orderId,
    delivery: delivery,
    qty: row[qtyIndex]
  }
}
module.exports.listFreights = syncFreights;
module.exports.getFreightsAndProductingsByProduct = getFreightsAndProductingsByProduct;


