var path = require('path');

var config = {
  log_dir: path.join(__dirname, 'logs'),
  debug: true
}

// if (process.env.NODE_ENV === 'test') {
//   config.db = 'mongodb://127.0.0.1:27017/crepe_test';
// }
config.db = 'mongodb://127.0.0.1:27017/crepe_test';
// console.log(process.env.NODE_ENV);
module.exports = config;