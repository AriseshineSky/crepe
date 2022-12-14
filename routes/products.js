var products = require('../controllers/products');
var express = require('express');
var router = express.Router();

router.get('/new', products.new);
router.get('/csv', products.csv);

router.get('/:asin/inbounds', products.showInbounds);
router.post('/:asin/inbounds', products.addInbound);
router.post('/:asin/inbound', products.updateInbound);
router.post('/:asin/inbound/:inboundId', products.deleteInbound);
router.post('/:asin/producing/:producingId', products.deleteProducing);
router.post('/:asin/producing', products.updateProducing);
router.post('/:asin/save', products.save);
router.get('/:asin/edit', products.edit);
router.get('/:asin/plan', products.plan);
router.get('/:asin/producing-plan', products.producingPlan);
router.get('/:asin/producings/:producingId/plan', products.producingPlan);
router.get('/:asin/freights', products.freights);
router.get('/:asin/syncFreight', products.syncFreight);
router.get('/:asin/report', products.generateReport);
router.post('/create', products.create);
router.get('/sync', products.sync);
router.get('/syncpm', products.syncpm);
router.post('/delete', products.delete);
router.get('/', products.index);
router.get('/:asin', products.show);
module.exports = router;
