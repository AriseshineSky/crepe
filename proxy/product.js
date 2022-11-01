var models  = require('../models');
var Product    = models.Product;

exports.getProductByAsin = function (asin, callback) {
  console.log(asin);
  Product.findOne({'asin': asin}, callback);
};

exports.newAndSave = function (asin, cycle, units_per_box, box, max_avg_sales, callback) {
  var product = new Product();
  product.asin = asin;
  product.cycle = cycle;
  product.units_per_box = units_per_box;
  product.box = box;
  product.max_avg_sales = max_avg_sales;
  product.save(callback);
};
