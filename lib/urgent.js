fbaInventory = require('../api/fbaInventory')

const axios = require('axios');
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
      products.forEach(function(product) {
        if (checkProduct(product) && checkProduct(product) < 10) {
          const axios = require('axios');
          var pmLink = `https://gideonwarriors.com/graphql?query=query%20{%20product(%20asin:%20%22${product.asin}%22%20country:%20%22US%22%20)%20{%20id%20asin%20country%20name%20users%20{%20name%20email%20role%20team%20chat_id%20}%20}%20}`
          axios.get(pmLink).then(function (response) {
            console.log(response.data)
            if (response.data.data && response.data.data.product && response.data.data.product.users[0]) {
              var pm = response.data.data.product.users[0].name
            } else {
              var pm = 'unknown'
            }
            
            console.log(pm)
            var content = `PM: ${pm}, marketId: ${product.marketId}, marketName: ${product.marketName}, asin: ${product.asin}, productName: ${product.listingTitle}, avgSevenPs: ${product.avgSevenPs}, fbaQuantity: ${product.fbaQuantity}, days: ${checkProduct(product)} \n`
            writeToFile(`${__dirname}/products.csv`, content)
          });
          console.log(product)
        }
      })
    }

  var record = `total: ${data.total}, page: ${data.page}, pagesize: ${data.pagesize}, checked: ${data.page * data.pagesize} \n`
  // writeToFile(`${__dirname}/products.csv`, record)
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
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NjYxNDkzOTAsInVzZXJJZCI6MTc2LCJ1c2VybmFtZSI6IjczNmFhM2FiZmJmZDRhN2Q4NTQzMDJlYWQ4ZDVkZjA2In0.57Xnd5cqFQhqR9uen9RRYLPVV3UGtOMQEwbdIjAAc6c',
    expiresIn: 1666149389.421
  }

  for (var i = 1; i < 220; i++) {
    var data = {
      "page": i,
      "sort": "addDate",
      "order": "ascend",
      "pagesize": 20
    }
    await asyncFunc(url, token, data).then(res=>{});
  }
  // var data = {
  //     "page": 1,
  //     "sort": "addDate",
  //     "order": "ascend",
  //     "asin": "B08M2HRV2W",
  //     "pagesize": 20
  //   }
  //   // await asyncFunc(url, token, data).then(res=>{});
  //   var writeToLog = function(data) {
  //     console.log(typeof(data))
  //     writeToFile('./development.log', JSON.stringify(data))
  //   }
  //   function writeToFile(fileName, content) {
  //     var fs = require('fs');
  //     fs.writeFile(`${fileName}`, `${content}`, {'flag': 'a'}, function(err) {
  //       if (err) {
  //         throw err;
  //       }
  //     })
  //   }
    // selling(url, token, data, writeToLog);

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