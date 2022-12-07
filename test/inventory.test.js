var assert = require('assert');
var checkProductsInventory = require('../lib/checkProductsInventory');
var Product = require('../proxy').Product;
const { ObjectId } = require('mongodb');

var listings = [
{ "_id" : ObjectId("638df9cc0909726a073978c2"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003CTVYVV", "account" : "V54", "__v" : 0, "availableQuantity" : 1073, "inboundShipped" : 0, "ps" : 54.1, "reservedFCProcessing" : 317, "reservedFCTransfer" : 2230 },
{ "_id" : ObjectId("638df9e10909726a07398608"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003ARNVQL", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 6, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638df9e60909726a07398906"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003FRBI0H", "account" : "V81", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24247b37bf1eec4f54cc"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003AIDZU7", "account" : "V32", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a92"), "asin" : "B0B4PW6ZKY", "country" : "UK", "fnsku" : "X001NBHJR5", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5ade"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "B0B4PW6ZKY", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afc"), "asin" : "B0B4PW6ZKY", "country" : "CA", "fnsku" : "B0B4PW6ZKY", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afc"), "asin" : "B0B4PW6ZKY", "country" : "CA", "fnsku" : "B0B4PW6ZKY", "account" : "V65", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a90"), "asin" : "B0B98XCZFX", "country" : "UK", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5aac"), "asin" : "B0B98XCZFX", "country" : "EU", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afa"), "asin" : "B0B98XCZFX", "country" : "CA", "fnsku" : "B0B98XCZFX", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5be3"), "asin" : "B0B98XCZFX", "country" : "US", "fnsku" : "X003JYLTYL", "account" : "V81", "__v" : 0, "availableQuantity" : 7, "inboundShipped" : 6, "ps" : 35, "reservedFCProcessing" : 2, "reservedFCTransfer" : 5 },
{ "_id" : ObjectId("638df9cc0909726a073978c2"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003CTVYVV", "account" : "V54", "__v" : 0, "availableQuantity" : 1073, "inboundShipped" : 0, "ps" : 54.1, "reservedFCProcessing" : 317, "reservedFCTransfer" : 2230 },
{ "_id" : ObjectId("638df9e10909726a07398608"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003ARNVQL", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 6, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638df9e60909726a07398906"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003FRBI0H", "account" : "V81", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24247b37bf1eec4f54cc"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003AIDZU7", "account" : "V32", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a92"), "asin" : "B0B9V2J168", "country" : "UK", "fnsku" : "X001NBHJR5", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5ade"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "B0B4PW6ZKY", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afc"), "asin" : "B0B9V2J168", "country" : "CA", "fnsku" : "B0B4PW6ZKY", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a90"), "asin" : "B09RG7HPRZ", "country" : "UK", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5aac"), "asin" : "B09RG7HPRZ", "country" : "EU", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afa"), "asin" : "B09RG7HPRZ", "country" : "CA", "fnsku" : "B0B98XCZFX", "account" : "V64", "__v" : 0, "availableQuantity" : 48, "inboundShipped" : 47, "ps" : 17, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5be3"), "asin" : "B09RG7HPRZ", "country" : "US", "fnsku" : "X003JYLTYL", "account" : "V81", "__v" : 0, "availableQuantity" : 7, "inboundShipped" : 6, "ps" : 10, "reservedFCProcessing" : 2, "reservedFCTransfer" : 5 }
]

const inventoryShortages = [{
  asin: "B0B98XCZFX",
  country: "US",
}];
const inventoryEnoughs = [{
  asin: "B0B4PW6ZKY",
  country: "US",
}, {
  asin: "B09RG7HPRZ",
  country: "CA",
}];

const singleInventorys = [{
  asin: "B0B98XCZFX",
  country: "US",
}, {
  asin: "B09RG7HPRZ",
  country: "CA",
}];

const multiInventorys = [{
  asin: "B0B9V2J168",
  country: "US",
}, {
  asin: "B0B4PW6ZKY",
  country: "CA",
}];

describe('checkProductsInventory', function() {
  describe('checkProductInventoryShortage', function() {
    it('should return true when product inventory is less than 10 days sals', async function () { 
      for (var inventoryShortage of inventoryShortages) {
        var data = await Product.prepareFbaInventoryAndSalesByCountryV2(inventoryShortage.asin, inventoryShortage.country, listings);
        var status = await checkProductsInventory.checkProductInventoryShortage(data, 10);
        assert.equal(status.shortage, true);
      }
    });
    it('should return false when product inventory is more than 10 days sals', async function () {
      for (var inventoryEnough of inventoryEnoughs) {
        var data = await Product.prepareFbaInventoryAndSalesByCountryV2(inventoryEnough.asin, inventoryEnough.country, listings);
        var status = await checkProductsInventory.checkProductInventoryShortage(data, 10);
        assert.equal(status.shortage, false);
      }
    });
  });
  describe('checkProductSingleInventory', function() {
    it('should return false when product has muli-accounts', async function () {
      for (var multiInventory of multiInventorys) {
        var data = await Product.prepareFbaInventoryAndSalesByCountryV2(multiInventory.asin, multiInventory.country, listings);
        console.log(data.sales, multiInventory.country)
        var single = await checkProductsInventory.checkProductSingleInventory(data, listings, multiInventory.country, multiInventory.asin);
        assert.equal(single, false);
      }
    });
    it('should return true when product has single-accounts', async function () {
      for (var singleInventory of singleInventorys) {
        var data = await Product.prepareFbaInventoryAndSalesByCountryV2(singleInventory.asin, singleInventory.country, listings);
        console.log(data.sales, singleInventory.country)
        var single = await checkProductsInventory.checkProductSingleInventory(data, listings, singleInventory.country, singleInventory.asin);
        assert.notEqual(single, false);
      }
    });
  });
})

