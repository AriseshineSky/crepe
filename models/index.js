var mongoose = require('mongoose');
var config = require('../config');
// // var logger = require('../common/logger');
mongoose.connect(config.db, {
  // useCreateIndex: true,
  useNewUrlParser: true
}, function (err) {
  if (err) {
    // logger.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

require('./product');
require('./user');
exports.Product = mongoose.model('Product');
exports.User = mongoose.model('User');