
const path = require('path');
var baseApi = require('./base');
var writeToFile = require('./writeToFile');
const axios = require('axios');
const { deflateRawSync } = require('zlib');
const COUNTRYS = ['US', 'CA', 'EU']
var getPm = function(asin) {
  return new Promise((resolve, reject) => {
    var pmLink = `https://gideonwarriors.com/graphql?query=query%20{%20product(%20asin:%20%22${asin}%22%20country:%20%22US%22%20)%20{%20id%20asin%20country%20name%20users%20{%20name%20email%20role%20team%20chat_id%20}%20}%20}`;
    axios.get(pmLink).then(function (response) {
      if (response.data.data && response.data.data.product && response.data.data.product.users[0]) {
        var pm = response.data.data.product.users[0].name;
      } else {
        var pm = 'unknown';
      }
      resolve(pm);
    });
  })
}

function parseAccountCountry(warehouseName) {
  return new Promise((resolve, reject) => {
    var country = warehouseName.split(":").pop().split("_")[0];
    var account = warehouseName.split(":")[0]
    resolve({
      country: country,
      account: account
    })
  })
}

function listingObject(listing) {
  return {
    warehouseId: listing.warehouseId,
    warehouseName: listing.warehouseName,
    availableQuantity: listing.availableQuantity,
    reservedFCTransfer: listing.reservedFCTransfer,
    reservedFCProcessing: listing.reservedFCProcessing,
    inboundWorking: listing.inboundWorking,
    inboundShipped: listing.inboundShipped,
    ps: listing.ps
  }
}

function parseListing(listing) {
  parseAccountCountry(listing.warehouseName).then((data)=>{
    if (listings.hasOwnProperty(listing.asin)) {
      if (listings[listing.asin].hasOwnProperty(data.country)) {
        if (listings[listing.asin][data.country].hasOwnProperty(data.account)) {
          listings[listing.asin][data.country][data.account].push(listingObject(listing));
        } else {
          listings[listing.asin][data.country][data.account] = [listingObject(listing)];
        }
      } else {
        listings[listing.asin][data.country] = {[data.account]: [listingObject(listing)]};
      }
    } else {
      listings[listing.asin] = {
        [data.country]: {[data.account]: [listingObject(listing)]}
      };
    }
  })
}

function checkProducts(listings) {
  return new Promise((resolve, reject) => {
    console.log(Object.keys(listings).length)
    for(var asin in listings) {
      checkProduct(listings[asin], asin);
    }
    resolve("success")
  })
}

function parseInventoryInfo(data) {
  return new Promise((resolve, reject) => {
    console.log(data.data.total);
    console.log(data.data.from);
    if (data.data && (data.data.total < data.data.from)) {
    // if (data.data && (100 < data.data.from)) {
      resolve("done");
      checkProducts(listings).then(
        function(res) {
        }, function(error) {
          reject("error");
        }
      );
      return;
    }
    var inventorys = data.data.rows;
  
    if (inventorys) {
      inventorys.forEach(function(inventory) {
        parseListing(inventory);
      })
      resolve("success");
    }
  })
}

function getProductInventorySalesByAccount(data) {
  return new Promise((resolve, reject)=>{
    var availableQuantity = 0;
    var reservedFCTransfer = 0;
    var inboundWorking = 0;
    var sales = 0;
    for(var listing of data) {
      availableQuantity = availableQuantity + listing.availableQuantity;
      reservedFCTransfer = reservedFCTransfer + listing.reservedFCTransfer;
      inboundWorking = inboundWorking + listing.inboundWorking;
      sales = sales + listing.ps;
    }
    resolve({
      availableQuantity: availableQuantity,
      reservedFCTransfer: reservedFCTransfer,
      inboundWorking: inboundWorking,
      sales: sales
    });
  })
}

// async function getProductInventorySalesByCountry(data) {
//   return new Promise(async (resolve, reject)=>{
//     var availableQuantity = 0;
//     var reservedFCTransfer = 0;
//     var inboundWorking = 0;
//     var sales = 0;
//     for(var account in data) {
//       console.log('----')
//       console.log(sales)
//       await getProductInventorySalesByAccount(data[account]).then((data)=>{
//         availableQuantity = availableQuantity + data.availableQuantity;
//         reservedFCTransfer = reservedFCTransfer + data.reservedFCTransfer;
//         inboundWorking = inboundWorking + data.inboundWorking;
//         sales = sales + data.sales;
//         console.log(data.sales)
//         console.log(sales)
//       })
//     }
//     console.log(sales)
//     resolve({
//       availableQuantity: availableQuantity,
//       reservedFCTransfer: reservedFCTransfer,
//       inboundWorking: inboundWorking,
//       sales: sales
//     })
//   })
// }

async function getProductInventorySalesByCountry(data) {
  return new Promise(async (resolve, reject)=>{
    var availableQuantity = 0;
    var reservedFCTransfer = 0;
    var inboundWorking = 0;
    var inboundShipped = 0;
    var sales = 0;
    for(var account in data) {
      for(var listing of data[account]) {
        availableQuantity = availableQuantity + listing.availableQuantity;
        reservedFCTransfer = reservedFCTransfer + listing.reservedFCTransfer;
        inboundWorking = inboundWorking + listing.inboundWorking;
        inboundShipped = inboundShipped + listing.inboundShipped;
        sales = sales + listing.ps;
      } 
    }
  
    resolve({
      availableQuantity: availableQuantity,
      reservedFCTransfer: reservedFCTransfer,
      inboundWorking: inboundWorking,
      inboundShipped: inboundShipped,
      sales: sales
    })
  })
}
var checkProduct = function(product, asin) {
  for(var country in product) {
    (function(country){
      getProductInventorySalesByCountry(product[country]).then((data)=>{
        if (data.sales < 1) {
          return;
        } else {
          var availableDays = (data.availableQuantity) / data.sales;
          var totalDays = (data.availableQuantity + data.reservedFCTransfer + data.inboundWorking + data.inboundShipped) / data.sales;
          if (totalDays < 10) {
            (function(asin, country, data, totalDays, availableDays) {
              getPm(asin).then(function(pm) {
                var content = `${pm} \t${asin} \t${country} \t${data.availableQuantity} \t${data.reservedFCTransfer} \t${data.inboundWorking} \t${data.inboundShipped} \t${data.sales.toFixed(2)} \t${availableDays.toFixed(2)} \t${totalDays.toFixed(2)}\n`;
                writeToFile(`${__dirname}/accounts.csv`, content);
              }, function(error) {
                console.log(error);
              })
            })(asin, country, data, totalDays, availableDays);
          }
    
          if ((country.toUpperCase() == 'US' && (data.sales > 30)) || (country.toUpperCase() == 'CA' && (data.sales > 15))) {
            if (Object.keys(product[country]).length < 2) {
              (function(asin, country, account, data) {
                getPm(asin).then(function(pm) {
                  var content = `${pm} \t${asin} \t${country} \t${data.sales} \t${account[0].warehouseName}\n`;
                  writeToFile(`${__dirname}/list.csv`, content);
                }, function(error) {
                  console.log(error);
                })
              })(asin, country, Object.values(product[country])[0], data);
            }
          }
        }
      })
    })(country)
    
    
  }
}
var fbaInventory = async function(token) {
  var url = `${gerpgo_api_prefix}` + `${open_apis.fbaInventory}`;
  var i = 1;
  var state = "pending"
  while (i < 18) {
    var data = {
      "page": i,
      "sort": "inventoryQuantity",
      "order": "descend",
      "pagesize": 200
    }
    await asyncFunc(url, data, token).then(function(res){
      state = res;
      if (state == "done") { 
        return;
      }
    }, function(error) {
      console.log(error)
    });
    if (state == "done") { 
      break;
    }
    console.log(i++)
    // i++;
  }
}

var asyncFunc = function(url, data, token) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      baseApi(url, data, token).then(function(data) {
        parseInventoryInfo(data).then(function(res){
          resolve(res);
        }, function(error){
          reject(error);
        })
      }, function(error) {
        reject(error);
      });
    }, 1000);
  });
}
module.exports = {
  fbaInventory
}
