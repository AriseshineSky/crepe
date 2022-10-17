module.exports = function(url, token) {
  var md5 = require('md5');
  data = {
    "beginDate": "2022-10-01",
    "endDate": "2022-10-12",
    "groupByType": "asin",
    "order": "descend",
    "page": 1,
    "pagesize": 20,
    "showCurrencyType": "USD",
    "sort": "unitsOrdered"
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
      console.log(res.data.data.rows[0])
      return res.data;
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );
}