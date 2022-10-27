var base = require('./base')

function products() {
  return new Promise((resolve, reject)=>{
    base(yisucangApis.product).then((data)=>{
      var products = data.Data;
      resolve(products);
    })
  })
}

exports.yisucangProducts = products;