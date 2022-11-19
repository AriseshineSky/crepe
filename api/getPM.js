module.exports = function(asin, country) {
  const axios = require('axios');
  return new Promise((resolve, reject) => {
    var pmLink = `https://gideonwarriors.com/graphql?query=query { product( asin: ${asin} country: ${country} ) { id asin country name users { name email role team chat_id } } }`;
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
