
const path = require('path');
const axios = require('axios');
var baseApi = require('./base')
var writeToFile = require('./writeToFile')

var checkProduct = function(asin) {
  
  if (listings[asin]) {

    for (var i in listings[asin]) {
      if (listings[asin][i] instanceof Object) {
        var productByMarket = listings[asin][i]
        console.log(productByMarket)
        if (productByMarket.avgSevenPs < 1) {
          return null;
        }
        var days = productByMarket.fbaQuantity / productByMarket.avgSevenPs
        if (days < 10) {
          var content = `asin: ${asin} \t  marketId: ${productByMarket.marketId} \t marketName: ${productByMarket.marketName} \n`
          writeToFile(`${__dirname}/accounts.csv`, content);
        }
      }
    }
  } else {
    return false
  }
}
var getPm = async function(listing) {
  var pmLink = `https://gideonwarriors.com/graphql?query=query%20{%20product(%20asin:%20%22${listing.asin}%22%20country:%20%22US%22%20)%20{%20id%20asin%20country%20name%20users%20{%20name%20email%20role%20team%20chat_id%20}%20}%20}`
  axios.get(pmLink).then(function (response) {
    if (response.data.data && response.data.data.product && response.data.data.product.users[0]) {
      var pm = response.data.data.product.users[0].name
    } else {
      var pm = 'unknown'
    }
    return pm;
  });
} 

async function parseListing(listing) {
  if (listings.hasOwnProperty(listing.asin)) {
    if (listings[listing.asin].hasOwnProperty(listing.marketId)) {
      listings[listing.asin][listing.marketId].fbaQuantity += listing.fbaQuantity;
      listings[listing.asin][listing.marketId].avgSevenPs += listing.avgSevenPs;
    } else {
      listings[listing.asin][listing.marketId] = {
        marketName: listing.marketName,
        fbaQuantity: listing.fbaQuantity,
        avgSevenPs: listing.avgSevenPs
      }
    }
  } else {
    listings[listing.asin] = {}
    listings[listing.asin].pm = await getPm(listing)
    listings[listing.asin][listing.marketId] = {
      marketName: listing.marketName,
      fbaQuantity: listing.fbaQuantity,
      avgSevenPs: listing.avgSevenPs
    }
  }
}

async function parseProductSellerAccounts(data) {
  
  const promise = new Promise((resolve, reject) => {
    var listingsInfo = data.data.rows;
    if (listingsInfo) {
      listingsInfo.forEach(function(listing) {
        parseListing(listing)
        // var content = `asin: ${account.asin}\t  marketId: ${account.marketId}\t marketName: ${account.marketName}\n`
        // var content = JSON.stringify(account);
        
        // writeToFile(`${__dirname}/accounts.csv`, content);
      })
    }
    resolve(1);
  })
  promise.then(res => {
    checkProduct(data.data.rows[0].asin)
  }, error => {
    console.log('失败结果：' + error);
  })

}

var getSellerAccountsByASIN = async function(token, asins = null) {
  var url = `${gerpgo_api_prefix}` + `${open_apis.selling}`;
  var data = {
    "page": 1,
    "sort": "addDate",
    "order": "ascend",
    "asin": asins.join(','),
    "pagesize": 200
  }
  await asyncFunc(url, token, data).then(res=>{
    
  });
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
  getSellerAccountsByASIN
}
