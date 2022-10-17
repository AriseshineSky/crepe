fbaInventory = require('../api/fbaInventory')

const axios = require('axios');
function getToken(url) {
  axios.post(url, {
    "appId":"736aa3abfbfd4a7d854302ead8d5df06",
    "appKey":"62daace5e4b073604b7e0b27"
  }).then(
    function(res){
      console.log(res)
      var token = {
        accessToken: res.data.data.accessToken,
        expiresIn: Date.now() / 1000 + res.data.data.expiresIn
      }
      console.log(token)
      return token;
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );
}

var token = {
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NjYwNjYyNDAsInVzZXJJZCI6MTc2LCJ1c2VybmFtZSI6IjczNmFhM2FiZmJmZDRhN2Q4NTQzMDJlYWQ4ZDVkZjA2In0.oapnBwqHzn_z2wrTMW7c1dA00dk4azRgWPqe74SZzIg',
  expiresIn: 1666066240.101
}
var gerpgo_api_prefix = 'https://prodopenflat.apist.gerpgo.com/open-api'
var open_apis = {
  token: '/api_token',
  sales: '/api/v2/finance/salesoperations/saleProfitDataGrid',
  listingAnalyze: '/api/v2/finance/salesoperations/listingAnalyze',
  selling: '/api/v2/channel/selling',
  detailSalesAndTraffic: '/api/v2/sale/businessReports/detailSalesAndTraffic',
  listingAnalyzeMultiIndex: '/api/v2/finance/salesoperations/listingAnalyzeMultiIndex',
  analysis: '/api/v2/channel/traffic/analysis',
  saleProfitDataGrid: '/api/v2/finance/salesoperations/saleProfitDataGrid',
  fbaInventory: '/api/v2/warehouse/fbaInventory'
}
var url = `${gerpgo_api_prefix}` + `${open_apis.selling}`;

var selling = require('../api/selling');

function parseProductInventoryInfo(data) {
  var fs = require('fs');
  var products = data.rows
  if (products) {
    console.log(products)
    products.forEach(function(product) {
      if (checkProduct(product) && checkProduct(product) < 10) {
        var content = `marketId: ${product.marketId}, marketName: ${product.marketName}, asin: ${product.asin}, productName: ${product.listingTitle}, avgSevenPs: ${product.avgSevenPs}, fbaQuantity: ${product.fbaQuantity}, days: ${checkProduct(product)} \n`
        writeToFile(`${__dirname}/products.csv`, content)
        console.log(product)
      }
    })
  }

  var record = `total: ${data.total}, page: ${data.page}, pagesize: ${data.pagesize}, checked: ${data.page * data.pagesize} \n`
  writeToFile(`${__dirname}/products.csv`, record)
  function writeToFile(fileName, content) {
    fs.writeFile(`${fileName}`, `${content}`, {'flag': 'a'}, function(err) {
      if (err) {
        throw err;
      }
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
var getFbaInventory = async function(url, token) {
  var url = `${gerpgo_api_prefix}` + `${open_apis.selling}`;
  var token = {
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NjYwNjYyNDAsInVzZXJJZCI6MTc2LCJ1c2VybmFtZSI6IjczNmFhM2FiZmJmZDRhN2Q4NTQzMDJlYWQ4ZDVkZjA2In0.oapnBwqHzn_z2wrTMW7c1dA00dk4azRgWPqe74SZzIg',
    expiresIn: 1666066240.101
  }

  for (var i = 1; i < 200; i++) {
    var data = {
      "page": i,
      "sort": "addDate",
      "order": "ascend",
      "pagesize": 20,
      "asin": "B08M2HRV2W"
    }
    await asyncFunc(url, token, data).then(res=>{});
  }

}
var asyncFunc = function(url, token, data) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
        selling(url, token, data, parseProductInventoryInfo);
        resolve(data);
    }, 1000);
  });
}
module.exports = {
  getFbaInventory
}