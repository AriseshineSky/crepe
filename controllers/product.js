var Product         = require('../proxy').Product;

exports.show = function (req, res, next) {
  var asin = req.params.asin;
  Product.getProductByAsin(asin, function (err, product) {
    console.log(err);
    console.log(product);
    if (err) {
      return next(err);
    }
    if (!product) {
      res.render404('这个产品不存在。');
      return;
    }

    res.render('product/show', {
      product: product
    });
  });
};
exports.new = function(req, res, next) {
  res.render('product/edit');
};

exports.create = function(req, res, next) {
  res.render('product/edit');
};

exports.put = function (req, res, next) {
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
      Product.newAndSave(asin, cycle, units_per_box, box, max_avg_sales, function (err, product) {
        if (err) {
          return next(err);
        }
        res.redirect('/product/' + product.asin);
      });
    } else {
      product.cycle = cycle;
      product.max_avg_sales = max_avg_sales;
      product.units_per_box = units_per_box;
      product.box = box;
  
      product.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/product/' + product.asin);
      });
    }
  });
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
      res.redirect('/product/' + product.asin);
    });
  });
};


