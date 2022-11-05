var Product         = require('../proxy').Product;
var Csv         = require('../proxy').Csv;
var plan = require('../lib/plan')
var mongoose = require('mongoose');
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

exports.index = async function (req, res, next) {
  var products = await Product.findAll();
  res.render('product/index', {
    products: products
  });
};

exports.plan = async function (req, res, next) {
  var asin = req.params.asin;
  var purchase = await Product.getPlan(asin);
  res.render('product/plan', {purchase: purchase, freight: FREIGHT});
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

exports.create = function(req, res, next) {
  res.render('product/edit', {
    title: "New"
  });
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
  var max_avg_sales = req.body.max_avg_sales;
  var units_per_box = req.body.units_per_box;
  var box = {
    length: req.body["box.length"],
    width: req.body["box.width"],
    height: req.body["box.height"],
    weight: req.body["box.weight"]
  }

  Product.getProductByAsin(asin, function (err, product) {

    if (!product) {
      res.render404('此产品不存在或已被删除。');
      return;
    }
    product.cycle = cycle;
    product.max_avg_sales = max_avg_sales;
    product.units_per_box = units_per_box;
    product.box = box;

    product.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/products/' + product.asin);
    });
  });
};

exports.csv = async function (req, res, next) {
  var products = await Csv.parseCsv('ProductDailyProfit-10212022-11042022.csv');
  res.render('/product/csv', {
    products: products
  });
};


