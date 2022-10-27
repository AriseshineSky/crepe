module.exports = function(url, data, token) {
  return new Promise((resolve, reject) => {
    var md5 = require('md5');
    var sign = md5(JSON.stringify(data) + '62daace5e4b073604b7e0b27')
    const options = {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'accessToken': token.accessToken,
        'sign': sign
      },
      data: data,
      url, url
    };
  
    const axios = require('axios');
    axios(options).then(
      function(res){
        resolve(res.data);
      }
    ).catch(
      function(error){
        reject(error)
      }
    );
  })
}
