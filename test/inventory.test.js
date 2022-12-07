var assert = require('assert');
var checkProductsInventory = require('../lib/checkProductsInventory');
var Product = require('../proxy').Product;
const { ObjectId } = require('mongodb');
var moment = require('moment');
var sinon = require('sinon');

var listings = [
{ "_id" : ObjectId("638df9cc0909726a073978c2"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003CTVYVV", "account" : "V54", "__v" : 0, "availableQuantity" : 1073, "inboundShipped" : 0, "ps" : 54.1, "reservedFCProcessing" : 317, "reservedFCTransfer" : 2230 },
{ "_id" : ObjectId("638df9e10909726a07398608"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003ARNVQL", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 6, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638df9e60909726a07398906"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003FRBI0H", "account" : "V81", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24247b37bf1eec4f54cc"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "X003AIDZU7", "account" : "V32", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a92"), "asin" : "B0B4PW6ZKY", "country" : "UK", "fnsku" : "X001NBHJR5", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5ade"), "asin" : "B0B4PW6ZKY", "country" : "US", "fnsku" : "B0B4PW6ZKY", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afc"), "asin" : "B0B4PW6ZKY", "country" : "CA", "fnsku" : "B0B4PW6ZKY", "account" : "V64", "__v" : 0, "availableQuantity" : 10, "inboundShipped" : 40, "ps" : 4, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afc"), "asin" : "B0B4PW6ZKY", "country" : "CA", "fnsku" : "B0B4PW6ZKY", "account" : "V65", "__v" : 0, "availableQuantity" : 20, "inboundShipped" : 50, "ps" : 2, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a90"), "asin" : "B0B98XCZFX", "country" : "UK", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5aac"), "asin" : "B0B98XCZFX", "country" : "EU", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afa"), "asin" : "B0B98XCZFX", "country" : "CA", "fnsku" : "B0B98XCZFX", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5be3"), "asin" : "B0B98XCZFX", "country" : "US", "fnsku" : "X003JYLTYL", "account" : "V81", "__v" : 0, "availableQuantity" : 7, "inboundShipped" : 6, "ps" : 35, "reservedFCProcessing" : 2, "reservedFCTransfer" : 5 },
{ "_id" : ObjectId("638df9cc0909726a073978c2"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003CTVYVV", "account" : "V54", "__v" : 0, "availableQuantity" : 1073, "inboundShipped" : 0, "ps" : 54.1, "reservedFCProcessing" : 317, "reservedFCTransfer" : 2230 },
{ "_id" : ObjectId("638df9e10909726a07398608"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003ARNVQL", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 6, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638df9e60909726a07398906"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003FRBI0H", "account" : "V81", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0.1, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24247b37bf1eec4f54cc"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "X003AIDZU7", "account" : "V32", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a92"), "asin" : "B0B9V2J168", "country" : "UK", "fnsku" : "X001NBHJR5", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5ade"), "asin" : "B0B9V2J168", "country" : "US", "fnsku" : "B0B9V2J168", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afc"), "asin" : "B0B9V2J168", "country" : "CA", "fnsku" : "B0B9V2J168", "account" : "V64", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5a90"), "asin" : "B09RG7HPRZ", "country" : "UK", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5aac"), "asin" : "B09RG7HPRZ", "country" : "EU", "fnsku" : "X001NBDL1D", "account" : "EU15", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5afa"), "asin" : "B09RG7HPRZ", "country" : "CA", "fnsku" : "B0B98XCZFX", "account" : "V64", "__v" : 0, "availableQuantity" : 148, "inboundShipped" : 347, "ps" : 17, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638e24367b37bf1eec4f5be3"), "asin" : "B09RG7HPRZ", "country" : "US", "fnsku" : "X003JYLTYL", "account" : "V81", "__v" : 0, "availableQuantity" : 178, "inboundShipped" : 6, "ps" : 10, "reservedFCProcessing" : 2, "reservedFCTransfer" : 5 },
{ "_id" : ObjectId("638d64d7877bc73648e1947e"), "asin" : "B0B69WKWFG", "country" : "US", "fnsku" : "X003B8KM4D", "account" : "V63", "__v" : 0, "availableQuantity" : 207, "inboundShipped" : 300, "ps" : 27, "reservedFCProcessing" : 20, "reservedFCTransfer" : 373 },
{ "_id" : ObjectId("638d6503877bc73648e1a118"), "asin" : "B0B69WKWFG", "country" : "CA", "fnsku" : "X003B8KM4D", "account" : "V63", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 60, "ps" : 0.1, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638d6503877bc73648e1a134"), "asin" : "B0B69WKWFG", "country" : "US", "fnsku" : "X003GC18WJ", "account" : "PL099", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 60, "ps" : 0.1, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638d6518877bc73648e1a710"), "asin" : "B0B69WKWFG", "country" : "US", "fnsku" : "B0B69WKWFG", "account" : "V41", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 },
{ "_id" : ObjectId("638d6518877bc73648e1a71a"), "asin" : "B0B69WKWFG", "country" : "CA", "fnsku" : "B0B69WKWFG", "account" : "V41", "__v" : 0, "availableQuantity" : 0, "inboundShipped" : 0, "ps" : 0, "reservedFCProcessing" : 0, "reservedFCTransfer" : 0 }
]
const GAP = 6;
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

const fbaInventorySalesAsin = "B0B69WKWFG";

describe('checkProductsInventory', function() {
  var product = {
    maxAvgSales: 35
  }
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
        var single = await checkProductsInventory.checkProductSingleInventory(data, listings, multiInventory.country, multiInventory.asin);
        assert.equal(single, false);
      }
    });
    it('should return true when product has single-accounts', async function () {
      for (var singleInventory of singleInventorys) {
        var data = await Product.prepareFbaInventoryAndSalesByCountryV2(singleInventory.asin, singleInventory.country, listings);
        var single = await checkProductsInventory.checkProductSingleInventory(data, listings, singleInventory.country, singleInventory.asin);
        assert.notEqual(single, false);
      }
    });
  });

  describe('checkProductInventorySales', function() {
    it('should return product fba inventory and sales', async function () {
      
  
      var data = await Product.prepareFbaInventoryAndSalesV2(fbaInventorySalesAsin, listings);
      assert.equal(data.inventory, 1000);
      assert.equal(data.sales, 28);

      product.asin = fbaInventorySalesAsin;
      var sales = await Product.getSales(data, product);
      assert.equal(sales.minAvgSales, 33);
      product.avgSales = 40;
      var sales = await Product.getSales(data, product);
      assert.equal(sales.minAvgSales, 40);
      
      const inboundShippeds = [ 
        { "orderId" : "OR4509", "quantity" : 480, "deliveryDue" : new Date("2022-12-06T06:00:00Z"), "box" : { "length" : 44, "width" : 29, "height" : 24, "weight" : 12.38, "units" : 120 }, "_id" : ObjectId("638d99c87bc44657562b33e6") }, 
        { "orderId" : "OR4509", "quantity" : 660, "deliveryDue" : new Date("2022-12-06T06:00:00Z"), "box" : { "length" : 44, "width" : 29, "height" : 24, "weight" : 12.38, "units" : 120 }, "_id" : ObjectId("638d99c87bc44657562b33e7") }, 
        { "orderId" : "OR4449", "quantity" : 1800, "deliveryDue" : new Date("2022-12-11T06:00:00Z"), "box" : { "length" : 27.3, "width" : 23, "height" : 30.8, "weight" : 11, "units" : 120 }, "_id" : ObjectId("638d99c87bc44657562b33e8") }, 
        { "orderId" : "OR4509", "quantity" : 2400, "deliveryDue" : new Date("2022-12-22T06:00:00Z"), "box" : { "length" : 44, "width" : 29, "height" : 24, "weight" : 12.38, "units" : 120 }, "_id" : ObjectId("638d99c87bc44657562b33e9") }, 
        { "orderId" : "OR4449", "quantity" : 3228, "deliveryDue" : new Date("2023-01-04T06:00:00Z"), "box" : { "length" : 27.3, "width" : 23, "height" : 30.8, "weight" : 12.18, "units" : 120 }, "_id" : ObjectId("638d99c87bc44657562b33ea") } ];

      var period = await Product.convertDeliveryDueToPeroid(inboundShippeds[0]);
      var check = moment(new Date("2022-12-06T06:00:00Z")).diff(moment(), "days");
      assert.equal(period, check);

      var inbounds = await Product.convertInboundShippedsDeliveryDueToPeroid(inboundShippeds);
      for(var i = 0; i < inbounds.length; i++) {
        var check = moment(inboundShippeds[i].deliveryDue).diff(moment(), "days") + 6;
        assert.equal(inbounds[i].period, check);
        assert.equal(inbounds[i].quantity, inboundShippeds[i].quantity);
      }

      var totalInventory = 1360;
      await Product.addCurrentInventoryToInbounds(totalInventory, inbounds);
      assert.equal(inbounds[inbounds.length - 1].quantity, 1360);
      assert.equal(inbounds[inbounds.length - 1].period, 0);

      console.log(totalInventory)
      console.log(sales)

      product.minInventory = 7;
      product.cycle = 17;
      product.airDelivery = true;

      const freights = [{
        type: 'airExpress',
        period: 8
      },{
        type: 'airDelivery',
        period: 15
      },{
        type: 'seaExpress',
        period: 35
      },{
        type: 'sea',
        period: 45
      }]
      var findFreightByType = sinon.stub(Product, 'findFreightByType').callsFake(function(type) {
        return freights.find((freight) => freight.type === type);
      });

      findFreightByType.onCall('airExpress').returns({
        type: 'airExpress',
        period: 8
      });

      product.inboundShippeds = [ { "orderId" : "OR4141", "quantity" : 2016, "deliveryDue" : new Date("2022-12-07T06:00:00Z"), "box" : { "length" : 55, "width" : 34, "height" : 40, "weight" : 18.5, "units" : 36 }, "_id" : ObjectId("63902c03e1a8d1ae0d67f5c7") }, 
                                  { "orderId" : "OR4141", "quantity" : 2016, "deliveryDue" : new Date("2022-12-07T06:00:00Z"), "box" : { "length" : 55, "width" : 34, "height" : 40, "weight" : 18.5, "units" : 36 }, "_id" : ObjectId("63902c03e1a8d1ae0d67f5c8") }, 
                                  
                                  { "orderId" : "OR4141", "quantity" : 2988, "deliveryDue" : new Date("2022-12-28T06:00:00Z"), "box" : { "length" : 55, "width" : 34, "height" : 40, "weight" : 18.5, "units" : 36 }, "_id" : ObjectId("63902c03e1a8d1ae0d67f5cb") } ];
      product.producings = [ { "orderId" : "OR4766", "quantity" : 2016, "created" : new Date("2022-12-07T01:58:07Z"), "_id" : ObjectId("63902c03e1a8d1ae0d67f5cc") }, 
                              { "orderId" : "OR4665", "quantity" : 5004, "created" : new Date("2022-11-29T17:34:45Z"), "_id" : ObjectId("63902c03e1a8d1ae0d67f5cd") }, 
                              { "orderId" : "OR4138", "quantity" : 1004, "created" : new Date("2022-09-15T16:01:27Z"), "_id" : ObjectId("63902c03e1a8d1ae0d67f5d2") } ];
      product.avgSales = 0;
      product.ps = 260;
      product.sea = true;
      product.stock = 36;
      product.plwhs = 0;
      var orderDues = await Product.getOrderDue(product, totalInventory, sales);
      var quantity = totalInventory;
      for (var inbound of product.inboundShippeds) {
        quantity += inbound.quantity;
      }
      for (var producing of product.producings) {
        quantity += producing.quantity;
      }
      for(var freight of freights) {
        var check = moment().add(quantity / sales.minAvgSales - product.cycle - freight.period - GAP - product.minInventory, 'days');
        assert.equal(orderDues[freight.type].format('YYYY-MM-DD') , check.format('YYYY-MM-DD'));
      }
    });
  });
})

