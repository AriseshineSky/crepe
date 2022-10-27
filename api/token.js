const axios = require('axios');
var getToken = function(url) {
  return new Promise((resolve, reject) => {
    axios.post(url, {
      "appId":"736aa3abfbfd4a7d854302ead8d5df06",
      "appKey":"62daace5e4b073604b7e0b27"
    }).then(
      function(res){
        var token = {
          accessToken: res.data.data.accessToken,
          expiresIn: Date.now() / 1000 + res.data.data.expiresIn
        }
        resolve(token);
      }
    ).catch(
      function(error){
        console.log(error)
        reject(error)
      }
    );
  })
}
module.exports = {
  getToken
}