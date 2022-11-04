var express = require('express');
var router = express.Router();
var product = require('../controllers/product');

/* GET users listing. */
router.get('/', async function(req, res, next) {
  var product = await getPlwhsProductByASIN('B0B69WKWFG');
  console.log(product);
  res.render('stock', {product: product});
})
router.get('/:asin/plan', product.plan);
router.get('/:asin', product.show);
router.get('/new', product.new);

router.post('/create', product.create);
module.exports = router;
