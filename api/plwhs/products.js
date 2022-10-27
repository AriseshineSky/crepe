var base = require('./base')

function products() {
  return new Promise((resolve, reject)=>{
    base(plwhsApis.product).then((data)=>{
      var products = data;
      resolve(products);
    })
  })
}

exports.plwhsProducts = products;