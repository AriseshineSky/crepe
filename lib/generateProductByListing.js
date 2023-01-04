const Listing = require('../proxy').Listing;
const Product = require('../proxy').Product;

module.exports.generateProduct = async function() {
  var listings = await Listing.findAll();
  let asins = new Set();
  for(let listing of listings) {
    if (!asins.has(listing.asin)) {
      asins.add(listing.asin);
      console.log('adding asin: ',listing.asin);
      let product = await Product.getProductByAsin(listing.asin);
      if (!product) {
        Product.createNewProduct({asin: listing.asin});
      }
    }
  }
}
