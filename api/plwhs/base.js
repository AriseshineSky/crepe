module.exports = function(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url: url
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
