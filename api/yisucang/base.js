var FormData = require('form-data');

module.exports = function(url, data) {
  return new Promise((resolve, reject) => {
    const baseUrl = 'http://yisucang.com'
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
