var Product = require('../proxy').Product;
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

exports.put = async function(req, res, next) {
  var objId = req.params._id;

}

exports.index = async function (req, res, next) {
  res
  var products = await Product.findAll();
  res.render('product/index', {
    products: products
  });
};