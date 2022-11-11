var freights = require('../controllers/freights');
var express = require('express');
var router = express.Router();

router.get('/list', freights.list);

module.exports = router;
