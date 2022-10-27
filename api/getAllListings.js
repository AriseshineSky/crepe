const path = require('path');
var selling = require('../api/selling');
var baseApi = require('./base')
var writeToFile = require('./writeToFile')
function parseProductASIN(data) {
  var products = data.data.rows
  if (products) {
    products.forEach(function(product) {
      if (product.asin) {
        var content = `${product.asin}\n`
        writeToFile(`${path.resolve(__dirname, '..')}/data/asin.csv`, content)
      }
    });
  }
}

var getAllListings = async function(token) {
  var url = `${gerpgo_api_prefix}` + `${open_apis.selling}`;
  for (var i = 1; i < 220; i++) {
    var data = {
      "page": i,
      "sort": "addDate",
      "order": "ascend",
      "pagesize": 20
    }
    await asyncFunc(url, data, token).then(res=>{});
  }
}
var asyncFunc = function(url, data, token) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      baseApi(url, data, token, parseProductASIN);
      resolve(data);
    }, 1000);
  });
}
module.exports = {
  getAllListings
}