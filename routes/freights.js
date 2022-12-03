var freights = require('../controllers/freights');
var express = require('express');
var router = express.Router();

router.get('/list', freights.list);
router.get('/types', freights.types);
router.get('/sync', freights.sync);
router.get('/syncAll', freights.syncAll);

module.exports = router;
