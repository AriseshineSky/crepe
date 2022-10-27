
const path = require('path');
var baseApi = require('./base')
var writeToFile = require('./writeToFile')

function parseProductSellerAccounts(data) {
  console.log(data)
  var accounts = data.rows;
  if (accounts) {
    accounts.forEach(function(account) {
      var content = `asin: ${account.asin}\t  marketId: ${account.marketId}\t marketName: ${account.marketName}\t country: ${account.country}\n`
      writeToFile(`${__dirname}/accounts.csv`, content);
    })
  }
}

var listingAnalyze = async function(asin, token) {
  var url = `${gerpgo_api_prefix}` + `${open_apis.listingAnalyze}`;
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
  listingAnalyze
}
