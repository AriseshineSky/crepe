var productsApi = require('../api/yisucang/products');
var inventoriesApi = require('../api/yisucang/inventories');
// const logger = require('../logs');

class YiProduct {
  constructor() {
    this.products = null;
  }
  static async getInstance() {
    if(!this.instance) {
      this.instance = new YiProduct();
      this.instance.products = await productsApi.yisucangProducts();
    }
    return this.instance;
  }
}

class YiInventory {
  constructor() {
    this.inventories = null;
  }
  static async getInstance() {
    if(!this.instance) {
      this.instance = new YiInventory();
      this.instance.inventories = await inventoriesApi.inventories();
    }
    return this.instance;
  }
}

module.exports = async function(product) {
  if (product && product.yisucangId) {
    const yProduct = await YiProduct.getInstance();
    var yiProducts = yProduct.products;
    // var yiProducts = await productsApi.yisucangProducts();
    var yiProduct = yiProducts.filter(function(yiProduct) {
      return yiProduct.ID == product.yisucangId;
    })[0];
    if (yiProduct) {
      const yInventory = await YiInventory.getInstance();
      var inventories = yInventory.inventories;
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
