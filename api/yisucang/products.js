var base = require('./base')
var FormData = require('form-data');
function products() {
  return new Promise(async (resolve, reject)=>{
    var products = [];
    for(var id_key of YISUCANG_ID_KEYS) {
      const data = new FormData();
      data.append('PartnerID', id_key.PartnerID);
      data.append('PartnerKey', id_key.PartnerKey);
      var res = await base(yisucangApis.product, data);
      if (res.Data) {
        products = products.concat(res.Data);
      }
    }
    resolve(products);
  })
}

exports.yisucangProducts = products;