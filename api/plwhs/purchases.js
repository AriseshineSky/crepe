var base = require('./base')

function purchases() {
  return new Promise((resolve, reject)=>{
    base(plwhsApis.purchase).then((data)=>{
      var purchases = data.Data;
      resolve(purchases);
    })
  })
}

exports.plwhsPurchases = purchases;