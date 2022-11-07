var Product         = require('../proxy').Product;
exports.plan = function (req, res, next) {
  res.render('product/plan', {
    
  });
}

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


exports.create = function (req, res, next) {
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
  Product.getProductByAsin(asin, function (err, product) {

    if (!product) {
      var newProduct = {
        asin: asin,
        cycle: cycle, 
        unitsPerBox: unitsPerBox, 
        box: box,
        maxAvgSales: maxAvgSales
      }
      Product.newAndSave(newProduct, function (err, product) {
        if (err) {
          return next(err);
        }
        res.redirect('/product/' + product.asin);
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
        res.redirect('/product/' + product.asin);
      });
    }
  });
};

exports.put = function (req, res, next) {
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
  Product.getProductByAsin(asin, function (err, product) {

    if (!product) {
      var newProduct = {
        asin: asin,
        cycle: cycle, 
        unitsPerBox: unitsPerBox, 
        box: box,
        maxAvgSales: maxAvgSales
      }
      Product.newAndSave(newProduct, function (err, product) {
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
  var maxAvgSales = req.body.maxAvgSales;
  var unitsPerBox = req.body.unitsPerBox;
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
    product.maxAvgSales = maxAvgSales;
    product.unitsPerBox = unitsPerBox;
    product.box = box;

    product.save(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/product/' + product.asin);
    });
  });
};


