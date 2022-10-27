var productsApi = require('../api/yisucang/products');
var inventoriesApi = require('../api/yisucang/inventories');
const logger = require('../logs');

module.exports = async function(asin) {
  var products = await productsApi.yisucangProducts();
  var product = products.filter(function(product) {
    return product.ID == ASIN_MAP[asin].yisucangId;
  })[0];
  var inventories = await inventoriesApi.inventories();
  var inventory = inventories.filter(function(inventory) {
    return inventory.UPC == product.UPC;
  })[0];
  return({product: product, inventory: inventory});
}
