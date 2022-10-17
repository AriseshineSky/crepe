module.exports = function(url, token, data, callback) {
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
      // console.log(res.data.data)
      callback(res.data.data);
      return res;
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );
}