module.exports = function(url, token) {
  var md5 = require('md5');
  data = {
    "dateUnit": 1,
    "fromDate": "2022-10-01",
    "toDate": "2022-10-11",
    "marketId": 1
  }
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
      console.log(res)
      return res.data;
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );
}