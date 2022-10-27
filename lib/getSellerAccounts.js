var getSellerAccountsByASIN = require('../api/getSellerAccountsByASIN')
var fs = require('fs');
const path = require('path');
const readline = require('readline');
var getSellerAccounts = async function(token) {
  const rl = readline.createInterface({
    input: fs.createReadStream(`${path.resolve(__dirname, '..')}/data/asin_all.csv`),
    output: process.stdout,
    terminal: false
  });
  var i = 0;
  var asins = []
  rl.on('line', (line) => {
    asins.push(line.trim())
    if (asins.length > 7) {
      i = i + 1;
      (function(i, asins) {
        setTimeout(function() {
          getSellerAccountsByASIN.getSellerAccountsByASIN(token, asins);
        }, i * 2000);
      })(i, asins)
      asins = []
    }
  });
  if (asins.length > 0) {
    i = i + 1;
    (function(i, asins) {
      setTimeout(function() {
        getSellerAccountsByASIN.getSellerAccountsByASIN(token, asins);
      }, i * 1000);
    })(i, asins)
    asins = []
  }
  
}

module.exports = {
  getSellerAccounts
}