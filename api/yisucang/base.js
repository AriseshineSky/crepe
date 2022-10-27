var FormData = require('form-data');

module.exports = function(url) {
  return new Promise((resolve, reject) => {
    const baseUrl = 'http://yisucang.com'
    const data = new FormData();
    data.append('PartnerID', '96648968');
    data.append('PartnerKey', '7fd301de-7d58-388f-044a-74ef521b18c5');
    const options = {
      method: 'POST',
      headers: { 
        'content-type': 'multipart/form-data'
      },
      data: data,
      url: baseUrl + url
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
