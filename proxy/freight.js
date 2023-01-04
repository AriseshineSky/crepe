var sheetApi = require('./sheetApi');
var larksuiteApi = require('../api/larksuite');
var Purchase = require('./purchases');
var Product = require('./product');
var models  = require('../models');
var FreightType = models.Freight;

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
var syncFreights = async function() {
  var freights = [];
  var rows = await larksuiteApi.listFreights();
  var header = rows.shift();
  var shippedDateIndex = header.indexOf("出货日期");
  var deliveryDueIndex = header.indexOf("预计到港时间");
  var deliveryIndex = header.indexOf("状态");
  var orderIndex = header.indexOf("系统订单");
  var qtyIndex = header.indexOf("出货数量");
  var boxIndex = header.indexOf("装箱信息");
  var typeIndex = header.indexOf("PM要求");

  for(var row of rows) {
    if (row[0] && row[1]) {
      var freight = await parseRow(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex, boxIndex, shippedDateIndex, typeIndex);
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
      box: freight.box,
      shippedDate: freight.shippedDate,
      fba: freight.fba
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

async function remvoeDuplicateYisucangInbounds(inbounds) {
  return inbounds.filter((elem, index, self) => {
    var count = 0;
    for (var inbound of inbounds) {
      if (inbound.number === elem.number) {
        count++;
      }
    }
    return count === 1;
  })
}

exports.remvoeDuplicateYisucangInbounds = remvoeDuplicateYisucangInbounds;

async function removeDeliveredFreights(freights, days, product) {
  var freights = freights.filter((freight) => {
    return moment(new Date()).diff(moment(freight.delivery), 'days') < days;
  })

  const inboundShipped = await Product.getInboundShippedCount(product.asin);
  while ((await sumFreights(freights)) > inboundShipped && freights.length > 0) {
    if (await removeFreight(freights, true)) {
      break;
    }
  }
  return freights;
}

async function findYisucangInbounds(inbounds, freight) {
  return inbounds.filter((elem) => {
    return elem.orderId === freight.orderId;
  })
}

async function sortFreightsByDelivery(freights) {
  return freights.sort(compare('delivery'))
}
var countBoxes = async function(objects) {
  var sum = 0;
  for (var obj of objects) {
    sum += Number(obj.boxCount);
  }
  return sum;
}

async function removeFreight(freights, fba) {
  var only = true;
  for (var i = 0; i < freights.length; i++) {
    if (freights[i].fba === fba && (moment(freights[i].delivery).diff(moment(new Date()), 'days') < 5)) {
      only = false;
      freights.splice(i, 1);
      break;
    }
  }
  return only;
}
async function checkFreightsV2(freights, inbounds, recieved) {
  if (recieved) {
    return [];
  }
  freights = await sortFreightsByDelivery(freights);
  var originalBoxCount = await countBoxes(freights);
  var leftBoxes = originalBoxCount - await countBoxes(inbounds);
  while ((await countBoxes(freights)) > leftBoxes && freights.length > 0) {
    console.log(freights);
    if (await removeFreight(freights, false)) {
      break;
    }
  }
  return freights;
}

async function syncBoxInfo(freight, product) {
  if (!product.unitsPerBox || product.unitsPerBox === 1) {
    product.unitsPerBox = freight.box.units || product.unitsPerBox;
    product.box.length = freight.box.length || product.box.length;
    product.box.width = freight.box.width || product.box.width;
    product.box.height = freight.box.height || product.box.height;
    product.box.weight = freight.box.weight || product.box.weight;
  }
}
async function checkFreightBox(freight){
  if (freight.box) {
    return (freight.box.units !== 1 && freight.box.length !== 1 && freight.box.width !== 1 && freight.box.height !== 1 && freight.box.weight !== 1);
  } else {
    return false;
  }
}
async function findFreightByType(freights, type) {
  return freights.find(function(freight){
    return freight.type === type}
  );
}

async function matchFreightAndProducing(freight, producing) {
  return (freight.orderId === producing.orderId);
}

async function addDefaultDeliveryToFreight(freight, types) {
  if(freight.type) {
    var freightType = await findFreightByType(types, freight.type);
  } else {
    var freightType  = await findFreightByType(types, 'seaExpress');
  }
  return moment(freight.shippedDate).add(freightType.period, 'days');
}
var getFreightsAndProductingsByProduct = async function(product, days) {
  var freights = [];
  var producings = [];
  const types = await freightTypes();
  const freightApi = await Freight.getInstance();
  var allFreights = freightApi.freights;
  console.log(`allFreights: ${allFreights.length}`);
  const yisucangInbounds = await getYisucangInbounds();
  var purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
  console.log(`purchases: ${purchases.length}`);
  var syncBoxFlag = false;
  for (var j = 0; j < purchases.length; j++) {
    console.log(`checking: ${j + 1} purchase`);
    var unShippedAmount = purchases[j].qty;
    var producingFreights = [];
    for (var i = 0; i < allFreights.length; i++) {
      if (await matchFreightAndProducing(allFreights[i], purchases[j])) {
        producingFreights.push(allFreights[i]);
        if (!syncBoxFlag && await checkFreightBox(allFreights[i])) {
          syncBoxFlag = await syncBoxInfo(allFreights[i], product);
        }
        unShippedAmount -= allFreights[i].qty;
        if (!allFreights[i].delivery) {
          
        }
        if (moment(new Date()).diff(moment(allFreights[i].delivery), 'days') < days) {
          freights.push(allFreights[i]);
        }
      }
    }
    
    if ((unShippedAmount / purchases[j].qty) > 0.15 && moment(new Date()).diff(moment(purchases[j].created), 'days') < 60) {
      producings.push({
        orderId: purchases[j].orderId,
        qty: unShippedAmount,
        delivery: purchases[j].us_arrival_date,
        created: purchases[j].created
      });
    }
  }

  freights = await checkFreightsV2(freights, yisucangInbounds);

  return await formatFreightsAndProductings({
    freights: freights,
    producings: producings
  })
}

async function getYisucangInboundsByOrderId(inbounds, orderId) {
  return inbounds.filter((elem) => {
    return (elem.orderId === orderId);
  })
}

async function checkFreightRecived(recieveds, orderId) {
  for (var recived of recieveds) {
    if (recived.orderId === orderId) {
      return true;
    }
  }
  return false;
}

var getFreightsAndProductingsByProductV2 = async function(product, days, types, allFreights, yisucangInbounds, yisucangReciveds) {
  var freights = [];
  var producings = [];
  
  if (!allFreights) {
    allFreights = await syncFreights();
  }

  if (!yisucangInbounds) {
    yisucangInbounds = await getYisucangInbounds();
    yisucangInbounds = await remvoeDuplicateYisucangInbounds(yisucangInbounds);
  }

  if (!yisucangReciveds) {
    yisucangReciveds = await getYisucangReciveds();
    yisucangReciveds = await remvoeDuplicateYisucangInbounds(yisucangReciveds);
  }

  if (!types) {
    types = await freightTypes();
  }

  var purchases = await Purchase.getPurchasesByProductId(product.plwhsId);
  console.log(`purchases: ${purchases.length}`);
  for (var j = 0; j < purchases.length; j++) {
    var unShippedAmount = purchases[j].qty;
    var producingFreights = [];
    for (var i = 0; i < allFreights.length; i++) {
      if (await matchFreightAndProducing(allFreights[i], purchases[j])) {
        producingFreights.push(allFreights[i]);
        unShippedAmount -= allFreights[i].qty;
        if (!allFreights[i].delivery) {
          allFreights[i].delivery = await addDefaultDeliveryToFreight(allFreights[i], types)
        }
      }
    }

    producingFreights = await checkFreightsV2(producingFreights, await getYisucangInboundsByOrderId(yisucangInbounds, purchases[j].orderId), await checkFreightRecived(yisucangReciveds, purchases[j].orderId));
    freights = freights.concat(producingFreights);
    
    var shipped = false;
    if ((unShippedAmount / purchases[j].qty) < 0.2 || moment(new Date()).diff(moment(purchases[j].created), 'days') > 60) {
      shipped = true;
    } else {
      producings.push({
        orderId: purchases[j].orderId,
        qty: unShippedAmount,
        delivery: purchases[j].us_arrival_date,
        created: purchases[j].created,
        inboundShippeds: producingFreights,
        shipped: shipped
      });
    }
  }

  return await formatFreightsAndProductings({
    freights: await removeDeliveredFreights(freights, days, product),
    producings: producings
  })
}

exports.getFreightsAndProductingsByProductV2 = getFreightsAndProductingsByProductV2;
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
    weight: 1,
    units: 1
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
    if (diStr && diStr[0].match(/[\d\.]+/)) {
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

var parseBoxCount = async function(boxInfo) {
  var boxCount = 0
  if (boxInfo) {
    var boxCountRe = /\d+箱/;
    var boxCountStr = boxInfo.match(boxCountRe);
    if (boxCountStr) {
      boxCount = Number(boxCountStr[0].match(/[\d]+/)[0]);
    }
  }
  return boxCount;
}

async function parseShippedDate(dateInfo) {
  if (dateInfo) {    
    return moment('1900/01/01').add(dateInfo, 'days');
    // return moment(dateInfo, 'MM/DD/YY');
  }
}

async function parseType(type) {
  if (type) {
    console.log(type);
    if (type.includes("海运")) {
      if (type.includes("限时达")) {
        return 'seaExpress';
      } else {
        return 'sea';
      }
    }
  
    if (type.includes("空运")) {
      if (type.includes("快递")) {
        return 'airExpress';
      } else {
        return 'airDelivery';
      }
    }
  }
}

async function parseFba(type) {
  if (type) {
    if (type.includes("FBA")) {
      return true;
    }
  }
  return false;
}


var parseRow = async function(row, orderIndex, deliveryIndex, deliveryDueIndex, qtyIndex, boxIndex, shippedDateIndex, typeIndex) {
  var delivery = null;
  if (row[deliveryIndex]) {
    delivery = await parseDate(row[deliveryIndex]);
  } else if (row[deliveryDueIndex]) {
    delivery = await parseDate(row[deliveryDueIndex]);
  }
  var box = await parseBox(row[boxIndex]);
  var boxCount = await parseBoxCount(row[boxIndex]);
  var shippedDate = await parseShippedDate(row[shippedDateIndex]);
  var orderId = await parseOrderId(row[orderIndex]);
  logger.debug('shippedDate', shippedDate, row[shippedDateIndex], shippedDateIndex, row);
  var type = await parseType(row[typeIndex]);
  var fba = await parseFba(row[typeIndex]);

  return {
    orderId: orderId,
    delivery: delivery,
    qty: row[qtyIndex],
    shippedDate: shippedDate,
    type: type,
    box: box,
    boxCount: boxCount,
    fba: fba
  }
}

const TYPES = {
  '空运': 'airExpress',
  '空派': 'airDelivery',
  '快船': 'seaExpress',
  '慢船': 'sea'
}

async function freightTypes() {
  return await FreightType.find({});
}

async function parseYisucangRow(row, HEADER) {
  var number = row[HEADER.indexOf('入库单号')];
  var orderId = await parseOrderId(row[HEADER.indexOf('物流追踪单号')]);
  var quantity = row[HEADER.indexOf('入库数量')];
  var date = row[HEADER.indexOf('入库时间')];
  return {
    number: number,
    orderId: orderId,
    boxCount: Number(quantity),
    date: date
  }
}

async function getYisucangInbounds() {
  var rows = await sheetApi.listInbounds();
  const HEADER = rows.shift();
  inbounds = [];
  for (var row of rows) {
    if (row[0]) {
      inbounds.push(await parseYisucangRow(row, HEADER))
    }
  }
  return inbounds;
}

exports.getYisucangInbounds = getYisucangInbounds;

async function getYisucangReciveds() {
  var rows = await sheetApi.listRecieveds();
  const HEADER = rows.shift();
  recieveds = [];
  for (var row of rows) {
    if (row[0]) {
      recieveds.push(await parseYisucangRow(row, HEADER))
    }
  }
  return recieveds;
}

exports.getYisucangReciveds = getYisucangReciveds;

async function syncFreightTypes() {
  var rows = await sheetApi.listFreightTypes();
  logger.debug(rows);
  for (var row of rows) {
    if (row[0] in TYPES) {
      var freightTpye = await FreightType.findOne({'type':  TYPES[row[0]]});
      logger.debug(' freightTpye',freightTpye);
      
      if (freightTpye) {
        freightTpye.period = Number(row[1]);
        freightTpye.price = Number(row[2]);
        freightTpye.save(function(error) {
          if (error) {
            logger.error(error);
          }
        })
      } else {
        freightTpye = new FreightType();
        freightTpye.type =  TYPES[row[0]];
        freightTpye.period = Number(row[1]);
        freightTpye.price = Number(row[2]);
        logger.debug(freightTpye);
        freightTpye.save(function(error) {
          if (error) {
            logger.error(error);
          }
        })
      }
    }
  }
}
exports.TYPES = TYPES;
exports.syncFreightTypes = syncFreightTypes;
exports.freightTypes = freightTypes;
exports.syncFreights = syncFreights;
exports.getFreightsAndProductingsByProduct = getFreightsAndProductingsByProduct;