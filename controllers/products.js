var Product         = require('../proxy').Product;
var Csv         = require('../proxy').Csv;
var plan = require('../lib/plan')
var mongoose = require('mongoose');
var syncProducts = require('../lib/getInfoFromGoogleSheet')
exports.show = async function (req, res, next) {
  var asin = req.params.asin;
  var product = await Product.getProductByAsin(asin);
  if (!product) {
    res.render404('这个产品不存在。');
    return;
  } else {
    res.render('product/show', {
      product: product,
      title: ""
    });
  }
};

exports.delete = async function (req, res, next) {
  var asin = req.body.asin;
  var productId = req.body.productId;
  await Product.remove(asin, productId);
  res.redirect('/products');
};

exports.index = async function (req, res, next) {
  var products = await Product.findAll();
  res.render('product/index', {
    products: products
  });
};

exports.sync = async function(req, res, next) {
  syncProducts.syncProducts();
  res.render('index');
}
// exports.plan = async function (req, res, next) {
//   var asin = req.params.asin;
//   var purchase = await Product.getPlan(asin);
//   if (purchase.plan) {
//     console.log(`${purchase.seaFreightDue}\t${purchase.quantity.quantity}\t${purchase.plan.airExpress.units}\t \t${purchase.plan.seaExpress.units}\t${purchase.plan.sea.units}\t`)
//   }
//   res.render('product/plan', {purchase: purchase, freight: FREIGHT});
// };

exports.plan = async function (req, res, next) {
  var asin = req.params.asin;
  var purchase = await Product.getPlanV2(asin);
  // if (purchase.plan) {
  //   console.log(`${purchase.seaFreightDue}\t${purchase.quantity.quantity}\t${purchase.plan.airExpress.units}\t \t${purchase.plan.seaExpress.units}\t${purchase.plan.sea.units}\t`)
  // }
  // res.render('product/plan', {purchase: purchase, freight: FREIGHT});
};

exports.edit = async function (req, res, next) {
  var asin = req.params.asin;
  var product = await Product.getProductByAsin(asin);

  if (!product) {
    res.render404('这个产品不存在。');
    return;
  } else {
    res.render('product/edit', {
      product: product,
      title: ""
    });
  }
};
exports.new = function(req, res, next) {
  console.log("new");
  res.render('product/new', {
    title: "New"
  });
};

exports.create = async function (req, res, next) {
  var asin = req.body.asin;
  var cycle = req.body.cycle;
  var maxAvgSales = req.body.maxAvgSales;
  var unitsPerBox = req.body.unitsPerBox;
  var box = {
    length: req.body["box.length"],
    width: req.body["box.width"],
    height: req.body["box.height"],
    weight: req.body["box.weight"]
  }
  var plwhsId = req.body.plwhsId;
  var yisucangId = req.body.yisucangId;
  var airDelivery = req.body.airDelivery;
  var product = await Product.getProductByAsin(asin);
  console.log(product);
  if (!product) {
    var newProduct = {
      asin: asin,
      cycle: cycle, 
      unitsPerBox: unitsPerBox, 
      box: box,
      maxAvgSales: maxAvgSales,
      plwhsId: plwhsId,
      yisucangId: yisucangId,
      airDelivery: airDelivery
    }
    Product.newAndSave(newProduct, function (err, product) {
      console.log(product);
      if (err) {
        return next(err);
      }
      res.redirect('/products');
    });
  } else {
    product.cycle = cycle;
    product.maxAvgSales = maxAvgSales;
    product.unitsPerBox = unitsPerBox;
    product.box = box;
    product.plwhsId = plwhsId;
    product.yisucangId = yisucangId;
    product.airDelivery = airDelivery;
    product.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/products/');
    });
  }
};


exports.save = async function (req, res, next) {
  var asin = req.body.asin;
  var cycle = req.body.cycle;
  var maxAvgSales = req.body.maxAvgSales;
  var unitsPerBox = req.body.unitsPerBox;
  var box = {
    length: req.body["box.length"],
    width: req.body["box.width"],
    height: req.body["box.height"],
    weight: req.body["box.weight"]
  }
  var plwhsId = req.body.plwhsId;
  var yisucangId = req.body.yisucangId;
  var airDelivery = req.body.airDelivery;
  var product = await Product.getProductByAsin(asin);
  if (!product) {
    var newProduct = {
      asin: asin,
      cycle: cycle, 
      unitsPerBox: unitsPerBox, 
      box: box,
      maxAvgSales: maxAvgSales,
      plwhsId: plwhsId,
      yisucangId: yisucangId,
      airDelivery: airDelivery
    }
    Product.newAndSave(newProduct, function (err, product) {
      console.log(product);
      if (err) {
        return next(err);
      }
      res.redirect('/products' + product.asin);
    });
  } else {
    product.cycle = cycle;
    product.maxAvgSales = maxAvgSales;
    product.unitsPerBox = unitsPerBox;
    product.box = box;
    product.plwhsId = plwhsId;
    product.yisucangId = yisucangId;
    product.airDelivery = airDelivery;
    product.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/products/' + product.asin);
    });
  }
};

exports.put = async function (req, res, next) {
  var asin = req.body.asin;
  var cycle = req.body.cycle;
  var maxAvgSales = req.body.maxAvgSales;
  var unitsPerBox = req.body.unitsPerBox;
  var box = {
    length: req.body["box.length"],
    width: req.body["box.width"],
    height: req.body["box.height"],
    weight: req.body["box.weight"]
  }
  var product = await Product.getProductByAsin(asin);
  if (!product) {
    Product.newAndSave(asin, cycle, unitsPerBox, box, maxAvgSales, function (err, product) {
      if (err) {
        return next(err);
      }
      res.redirect('/products/' + product.asin);
    });
  } else {
    product.cycle = cycle;
    product.maxAvgSales = maxAvgSales;
    product.unitsPerBox = unitsPerBox;
    product.box = box;

    product.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/products/' + product.asin);
    });
  }
};

exports.addInbound = async function (req, res, next) {
  var asin = req.params.asin;
  var quantity = req.body.quantity;
  var deliveryDue = req.body.deliveryDue;
  console.log(quantity);
  var product = await Product.getProductByAsin(asin);
  if (!product) {
    return;
  } else {
    product.inboundShippeds.push({
      quantity: quantity,
      deliveryDue: deliveryDue
    });
    product.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/products/' + product.asin + '/inbounds');
    });
  }
};
exports.deleteInbound = async function(req, res, next) {
  var asin = req.body.asin;
  var quantity = req.body.quantity;
  var deliveryDue = req.body.deliveryDue;
  var inboundId = req.body.inboundId;
  console.log(inboundId)

  await Product.deleteInbound(inboundId);
  var product = await Product.getProductByAsin(asin);
  res.redirect('/products/' + product.asin + '/inbounds');
  

}
exports.showInbounds = async function (req, res, next) {
  var asin = req.params.asin;
  var product = await Product.getProductByAsin(asin);
  if (!product) {
    return;
  } else {
    res.render('product/inbound', {
      inbounds: product.inboundShippeds,
      product: product
    })
  }
};

exports.update = function (req, res, next) {
  var asin = req.body.asin;
  var cycle = req.body.cycle;
  var maxAvgSales = req.body.maxAvgSales;
  var unitsPerBox = req.body.unitsPerBox;
  var box = {
    length: req.body["box.length"],
    width: req.body["box.width"],
    height: req.body["box.height"],
    weight: req.body["box.weight"]
  }

  var product = Product.getProductByAsin(asin);
  if (!product) {
    res.render404('此产品不存在或已被删除。');
    return;
  }
  product.cycle = cycle;
  product.maxAvgSales = maxAvgSales;
  product.unitsPerBox = unitsPerBox;
  product.box = box;

  product.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/products/' + product.asin);
  });
};

exports.csv = async function (req, res, next) {
  var products = await Csv.parseCsv('ProductDailyProfit-10212022-11042022.csv');
  res.render('/product/csv', {
    products: products
  });
};