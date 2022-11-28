var plwhsApi = require('../api/plwhs/product');
const logger = require('../common/logger');

module.exports = async function(product) {
  if (product && product.plwhsId) {
    const plwhs = await plwhsApi(product.plwhsId);
    if (plwhs) {
      return(plwhs[0]);
    } else {
      return(0);
    }
  } else {
    return(0);
  }
}
