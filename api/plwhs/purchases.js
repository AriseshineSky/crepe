var base = require('./base')


function purchases(productId) {
  plwhsPurchaseApis = `https://plwhs.com/api/Purchases?filter={"where":{"productId":"${productId}"},"order":["id DESC"],"limit":50,"skip":0}`;
  return new Promise((resolve, reject)=>{
    base(plwhsPurchaseApis).then((data)=>{
      resolve(data);
    })
  })
}

exports.purchases = purchases;