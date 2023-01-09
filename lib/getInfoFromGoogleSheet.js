var Product = require('../proxy').Product;
var Csv = require('../proxy').Csv;
var sheetApi = require('../proxy').sheetApi;
var logger = require('../common/logger');
const HEADER = ['pm', 'asin', 'plwhsId', 
'yisucangId', 'cycle', 
'maxAvgSales', 
'box.length', 'box.width', 'box.height', 'unitsPerBox', 'box.weight' ]
const PRODUCT_ATTR = ['asin', 'plwhsId', 
'yisucangId', 'cycle', 
'maxAvgSales', 'unitsPerBox']
const INBOUND_ATTR = ['deliveryDue', 'quantity']
var syncProducts = async function() {
  var rows = await sheetApi.listProducts();
  var header = rows.shift();

  rows.forEach(function(row){
    if (row.length > 3) {
      parseRow(row)
    }
  })
  return rows;
}

var parseRow = async function(row) {
  var product = await Product.getProductByAsin(row[1]);
  var inboundShippeds = []
  if (row[12] && row[13]) {
    inboundShippeds.push({
      quantity: Number(row[12]),
      deliveryDue: row[13]
    })
  }
  if (row[14] && row[15]) {
    inboundShippeds.push({
      quantity: Number(row[14]),
      deliveryDue: row[15]
    })
  }
  if (row[16] && row[17]) {
    inboundShippeds.push({
      quantity: Number(row[16]),
      deliveryDue: row[17]
    })
  }
  if (!product) {
    var newProduct = {};
    var box = {
      length: row[HEADER.indexOf("box.length")],
      width: row[HEADER.indexOf("box.width")],
      height: row[HEADER.indexOf("box.height")],
      weight: row[HEADER.indexOf("box.weight")]
    }
    for(var i = 0; i < PRODUCT_ATTR.length; i++) {
      newProduct[PRODUCT_ATTR[i]] = row[HEADER.indexOf(PRODUCT_ATTR[i])]
    }
    newProduct.box = box;
    newProduct.inboundShippeds = inboundShippeds;
   
    Product.newAndSave(newProduct, function (err, product) {
      if (err) {
        return next(err);
      }
    });
  } else {
    var box = {
      length: row[HEADER.indexOf("box.length")],
      width: row[HEADER.indexOf("box.width")],
      height: row[HEADER.indexOf("box.height")],
      weight: row[HEADER.indexOf("box.weight")]
    }
    for(var i = 0; i < PRODUCT_ATTR.length; i++) {
      product[PRODUCT_ATTR[i]] = row[HEADER.indexOf(PRODUCT_ATTR[i])]
    }
    product.box = box;
    product.inboundShippeds = inboundShippeds;
    product.save(function (err) {
      if (err) {
        logger.error(err);
      }
    });
  }
}
module.exports.syncProducts = syncProducts;