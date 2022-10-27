
const path = require('path');
var selling = require('../api/selling');
var baseApi = require('./base')
var writeToFile = require('./writeToFile')

function parseProductASIN(data) {
  var products = data.data.rows
  if (products) {
    products.forEach(function(product) {
      console.log(product)
      if (product.asin) {
        var content = `${product.asin}\n`
        writeToFile(`${path.resolve(__dirname, '..')}/data/asin.csv`, content)
      }
    });
  }
}


function parseProductSellerAccounts(data) {
  var accounts = data.rows
  if (accounts) {
    accounts.forEach(function(account) {
      var content = `PM: ${pm}, marketId: ${product.marketId}, marketName: ${product.marketName}, asin: ${product.asin}, productName: ${product.listingTitle}, avgSevenPs: ${product.avgSevenPs}, fbaQuantity: ${product.fbaQuantity}, days: ${checkProduct(product)} \n`
      writeToFile(`${__dirname}/products.csv`, content);
    })
  }
}
var checkProduct = function(product) {
  if (product.avgSevenPs < 1) {
    return false
  } else {
    return(product.fbaQuantity / product.avgSevenPs)
  }
}
var selling = async function(url, token, asin = null) {
  var url = `${gerpgo_api_prefix}` + `${open_apis.selling}`;
  var data = {
    "page": 1,
    "sort": "addDate",
    "order": "ascend",
    "asin": asin,
    "pagesize": 200
  }
  await asyncFunc(url, token, data).then(res=>{});
}

var asyncFunc = function(url, token, data) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      baseApi(url, data, token, parseProductSellerAccounts);
      resolve(data);
    }, 1000);
  });
}
module.exports = {
  selling
}
