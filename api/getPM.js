module.exports = async function (asin, country) {
	const axios = require("axios");

	var pmLink = `https://gideonwarriors.com/graphql?query=query { product( asin: "${asin}" country: "${country}" ) { id asin country name users { name email role team chat_id } } }`;
	var response = await axios.get(pmLink);

	if (response.data.data && response.data.data.product && response.data.data.product.users[0]) {
		var pm = response.data.data.product.users[0];
	} else {
		var pm = "unknown";
	}
	return pm;
};
