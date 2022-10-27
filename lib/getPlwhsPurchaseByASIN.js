var purchasesApi = require('../api/plwhs/products');
const logger = require('../logs');

module.exports = async function(asin) {
  var purchases = await purchasesApi.plwhsPurchases();
  var purchasesByASIN = purchases.filter(function(purchase) {
    return purchase.id == ASIN_MAP[asin].plwhsId;
  });
  return({purchase: purchase});
}
