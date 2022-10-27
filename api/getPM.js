module.exports = function(asin) {
  const axios = require('axios');
  return new Promise((resolve, reject) => {
    var pmLink = `https://gideonwarriors.com/graphql?query=query%20{%20product(%20asin:%20%22${asin}%22%20country:%20%22US%22%20)%20{%20id%20asin%20country%20name%20users%20{%20name%20email%20role%20team%20chat_id%20}%20}%20}`;
    axios.get(pmLink).then(function (response) {
      if (response.data.data && response.data.data.product && response.data.data.product.users[0]) {
        var pm = response.data.data.product.users[0].name;
      } else {
        var pm = 'unknown';
      }
      resolve(pm);
    });
  });
}
