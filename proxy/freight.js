var Product = require('../proxy').Product;
var Csv = require('../proxy').Csv;
var sheetApi = require('./sheetApi');
var Purchase = require('./purchases');
var moment = require('moment');
var getStockByProduct = require('../lib/getStockByProduct');
var logger = require('../common/logger');
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
      logger.debug("new all freights instance");
      this.createdAt = new Date();
      this.instance.freights = await syncFreights();
    } else if (await this.checkExpired()) {
      this.instance.freights = await syncFreights();
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
      deliveryDue: producing.delivery,
      created: producing.created
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
    sum += Number(freight.qty);
  }
  return sum;
}

var checkFreights = async function(freights, pendingStorageNumber) {
  freights = await sortFreightsByDelivery(freights);
  while (Number(pendingStorageNumber > 0) && ((await sumFreights(freights)) > Number(pendingStorageNumber))) {
    freights.shift();
  }
}

async function syncBoxInfo(freight, product) {
  if (!product.unitsPerBox || product.unitsPerBox === 1) {
    product.unitsPerBox = freight.box.units || product.unitsPerBox;
    product.box.length = freight.box.length || product.box.length;
    product.box.width = freight.box.width || product.box.width;
    product.box.height = freight.box.height || product.box.height;
    product.box.weight = freight.box.weight || product.box.weight;
    product.save(function (err) {
      if (err) {
        logger.error(err);
        return false;
      } else {
        return true;
      }
    });
  }
}
async function checkFreightBox(freight){
  return (freight.box.units !== 1 && freight.box.length !== 1 && freight.box.width !== 1 && freight.box.height !== 1 && freight.box.weight !== 1)
}
var getFreightsAndProductingsByProduct = async function(product, days) {
  var freights = [];
  var producings = [];
  const freightApi = await Freight.getInstance();
  var allFreights = freightApi.freights;
  console.log(`allFreights: ${allFreights.length}`);
  var purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
  console.log(`purchases: ${purchases.length}`);
  var syncBoxFlag = false;
  for (var j = 0; j < purchases.length; j++) {
    console.log(`checking: ${j + 1} purchase`);
    var unShippedAmount = purchases[j].qty;
    for (var i = 0; i < allFreights.length; i++) {
      if (allFreights[i].orderId === purchases[j].orderId && allFreights[i].delivery) {
        if (!syncBoxFlag && await checkFreightBox(allFreights[i])) {
          syncBoxFlag = await syncBoxInfo(allFreights[i], product);
        }
        
        unShippedAmount -= allFreights[i].qty;
        if (moment(new Date()).diff(moment(allFreights[i].delivery), 'days') < days) {
          freights.push(allFreights[i]);
        }
      }
    }
    
    if ((unShippedAmount / purchases[j].qty) > 0.15 && moment(new Date()).diff(moment(purchases[j].created), 'days') < 90) {
      producings.push({
        orderId: purchases[j].orderId,
        qty: unShippedAmount,
        delivery: purchases[j].us_arrival_date,
        created: purchases[j].created
      });
    }
  }
  logger.debug(JSON.stringify(freights)); 
  logger.debug(JSON.stringify(purchases)); 
  console.log('before stock');
  var stock = await getStockByProduct(product);
  console.log('stock', stock.inventory);
  if (stock.inventory && stock.inventory !== 0) {
    product.stock = stock.inventory.SumNumber;
    product.save(function(err) {
      if (err) {
        logger.error(err);
      }
    });
    await checkFreights(freights, stock.inventory.PendingStorageNumber);
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

var parseQuantity = async function(quantity, boxInfo) {
  if (boxInfo) {
    var boxQtyRe = /\d+箱.*?\d+\/箱/;
    var diStr = boxInfo.match(boxQtyRe);
    if (diStr[0]) {
      var di = diStr[0].split(/[\*\×x]/);
      box = {
        length: Number(di[0]),
        width: Number(di[1]),
        height: Number(di[2])
      }
    }
  }
}

var parseBox = async function(boxInfo) {
  var box = {
    length: 1,
    width: 1,
    height: 1,
    weight: 1
  };
  if (boxInfo) {
    
    var diRe = /[\d\.]+(\*|\×|x)[\d\.]+(\*|\×|x)[\d\.]+/;
    var diStr = boxInfo.match(diRe);
    if (diStr) {
      var di = diStr[0].split(/[\*\×x]/);
      box = {
        length: Number(di[0]),
        width: Number(di[1]),
        height: Number(di[2])
      }
    } else {
      logger.info(diRe);
      logger.info(boxInfo);
      console.log(boxInfo);
    }

    var weightRe = /[\d\s\.]*(kg)/i;
    diStr = boxInfo.match(weightRe);
    if (diStr) {
      box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
    } else {
      weightRe = /[\d\s\.]+\/箱/gi;
      var diStrs = boxInfo.matchAll(weightRe);
      for (var diStr of diStrs) {
        if (Number(diStr[0].match(/[\d\.]+/)[0]) < 30) {
          box.weight = Number(diStr[0].match(/[\d\.]+/)[0]);
        }
      }
      console.log(boxInfo);
    }

    if (!box.weight) {
      logger.error(weightRe);
      logger.error(boxInfo);
      
    }
    
    var unitsRe = /\d+(盒|瓶|套|付|PCS|个|件)?\/箱/;
    var unitsStr = boxInfo.match(unitsRe);
    if (unitsStr) {
      box.units = Number(unitsStr[0].match(/[\d]+/)[0]);
    } else {
      unitsRe = /[\d\s\.]+\/箱/gi;
      var unitsStrs = boxInfo.matchAll(unitsRe);
      for (var unitsStr of unitsStrs) {
        if (Number(unitsStr[0].match(/[\d]+/)[0]) > 30) {
          box.units = Number(unitsStr[0].match(/[\d]+/)[0]);
        }
      }
      console.log(boxInfo);
    }
    if (!box.units) {
      logger.error(unitsRe);
      logger.error(boxInfo);
    }

    for (var type in box) {
      if (isNaN(box[type])) {
        logger.error("boxInfo");
        logger.error(box);
        logger.error(boxInfo);
      }
    }
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
module.exports.syncFreights = syncFreights;
module.exports.getFreightsAndProductingsByProduct = getFreightsAndProductingsByProduct;