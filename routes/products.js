var products = require('../controllers/products');
var express = require('express');
var router = express.Router();

router.get('/new', products.new);
router.get('/:asin', products.show);
router.get('/:asin/inbounds', products.showInbounds);
router.post('/:asin/inbounds', products.addInbound);
router.post('/:asin/save', products.save);
router.get('/:asin/edit', products.edit);
router.get('/:asin/plan', products.plan);
router.post('/create', products.put);
router.get('/', products.index);
module.exports = router;