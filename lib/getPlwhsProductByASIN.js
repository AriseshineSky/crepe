var productsApi = require('../api/plwhs/products');
const logger = require('../logs');

module.exports = async function(asin) {
  var products = await productsApi.plwhsProducts();
  console.log(ASIN_MAP[asin].plwhsId);
  var product = products.filter(function(product) {
    return product.id == ASIN_MAP[asin].plwhsId;
  })[0];
  return({product: product});
}
