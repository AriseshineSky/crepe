var productsApi = require('../api/yisucang/products');
var inventoriesApi = require('../api/yisucang/inventories');
const logger = require('../common/logger');

module.exports = async function(product) {
  if (product && product.yisucangId) {
    var yiProducts = await productsApi.yisucangProducts();
    var yiProduct = yiProducts.filter(function(yiProduct) {
      return yiProduct.ID == product.yisucangId;
    })[0];
    if (yiProduct) {
      var inventories = await inventoriesApi.inventories();
      var inventory = inventories.filter(function(inventory) {
        return inventory.UPC == yiProduct.UPC;
      })[0];
    } else {
      var inventory = 0;
    }
    return({product: yiProduct, inventory: inventory});
  } else {
    return({product: null, inventory: 0});
  }
}
