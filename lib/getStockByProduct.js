var productsApi = require('../api/yisucang/products');
var inventoriesApi = require('../api/yisucang/inventories');
const logger = require('../common/logger');

class YiProduct {
  constructor() {
    this.products = null;
  }
  static async getInstance() {
    if(!this.instance) {
      this.instance = new YiProduct();
      logger.debug("new all yisucang product instance");
      this.createdAt = new Date();
      this.instance.products = await productsApi.yisucangProducts();
    } else if (await this.checkExpired()) {
      this.instance.products = await productsApi.yisucangProducts();
    }
    return this.instance;
  }
  static async checkExpired() {
    var stime = Date.parse(this.createdAt);
    var etime = Date.parse(new Date());
    var hours = Math.floor((etime - stime) / (3600 * 1000));
    return hours > 1;
  }
}

class YiInventory {
  constructor() {
    this.inventories = null;
  }
  static async getInstance() {
    if(!this.instance) {
      this.instance = new YiInventory();
      logger.debug("new all yisucang inventory instance");
      this.createdAt = new Date();
      this.instance.inventories = await inventoriesApi.inventories();
    } else if (await this.checkExpired()) {
      this.instance.inventories = await inventoriesApi.inventories();
    }
    return this.instance;
  }

  static async checkExpired() {
    var stime = Date.parse(this.createdAt);
    var etime = Date.parse(new Date());
    var hours = Math.floor((etime - stime) / (3600 * 1000));
    return hours > 1;
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
