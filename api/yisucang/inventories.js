var base = require('./base')
var FormData = require('form-data');
function inventories() {
  return new Promise(async (resolve, reject)=>{
    var inventories = [];
    for(var id_key of YISUCANG_ID_KEYS) {
      const data = new FormData();
      data.append('PartnerID', id_key.PartnerID);
      data.append('PartnerKey', id_key.PartnerKey);
      var res = await base(yisucangApis.inventory, data);
      if (res.Data) {
        inventories = inventories.concat(res.Data);
      }
    }
    resolve(inventories);
  })
}

exports.inventories = inventories;