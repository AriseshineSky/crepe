var base = require('./base')

function inventories() {
  return new Promise((resolve, reject)=>{
    base(yisucangApis.inventory).then((data)=>{
      var inventories = data.Data;
      resolve(inventories)
    })
  })
}

exports.inventories = inventories;