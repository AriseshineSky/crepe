const logger = require('../../common/logger');
var base = require('./base')
module.exports = async function(id) {
  var plwhsProductApi = `https://plwhs.com/api/Products?filter={"where":{"id":"${id}"}}`;
  return new Promise((resolve, reject)=>{
    base(plwhsProductApi).then((data)=>{
      resolve(data);
    }), (error) => {
      logger.error(error);
    }
  })
}