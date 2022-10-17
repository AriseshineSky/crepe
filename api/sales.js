module.exports = function(url, token) {
  var md5 = require('md5');
  data = {
    "dimensionId": "ASIN",
    "showCurrencyType": "USD",
    "beginDate": "2022-10-01",
    "endDate": "2022-10-11",
    "isShowTotal": false,
    "page": 1,
    "pagesize": 20,
    "sort": "unitsOrdered",
    "order": "descend",
    "type": "ASIN"
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
      console.log(res.data)
      return res;
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );
}