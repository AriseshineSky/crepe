var assert = require('assert');
var checkProductsInventory = require('../lib/checkProductsInventory');

var listings = {"B0B69VTXWX":{"CA":{"V63":[{"warehouseId":168,"warehouseName":"V63:CA_FBA","availableQuantity":10,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":3}],"V41":[{"warehouseId":94,"warehouseName":"V41:CA_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}]}},
            "B0B5VW3MLD":{"US":{"F05":[{"warehouseId":225,"warehouseName":"F05:US_FBA","availableQuantity":788,"reservedFCTransfer":914,"reservedFCProcessing":113,"inboundShipped":0,"ps":107}]}},
            "B0B4PW6ZKY":{"US":{"V54":[{"warehouseId":91,"warehouseName":"V54:US_FBA","availableQuantity":0,"reservedFCTransfer":850,"reservedFCProcessing":155,"inboundShipped":0,"ps":218.1}],"V81":[{"warehouseId":242,"warehouseName":"V81:US_FBA","availableQuantity":395,"reservedFCTransfer":0,"reservedFCProcessing":4,"inboundShipped":0,"ps":0.1}],"V64":[{"warehouseId":220,"warehouseName":"V64:US_FBA","availableQuantity":0,"reservedFCTransfer":25,"reservedFCProcessing":149,"inboundShipped":0,"ps":21.4},{"warehouseId":220,"warehouseName":"V64:US_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}],"V32":[{"warehouseId":89,"warehouseName":"V32:US_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}]},"UK":{"EU15":[{"warehouseId":205,"warehouseName":"EU15:UK_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}]},"CA":{"V64":[{"warehouseId":221,"warehouseName":"V64:CA_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}]}},
            "B08M2HRV2W":{"UK":{"EU15":[{"warehouseId":205,"warehouseName":"EU15:UK_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":8,"inboundShipped":0,"ps":21.1}]}},
            "B0B9V2J168":{"US":{"F56":[{"warehouseId":142,"warehouseName":"F56:US_FBA","availableQuantity":210,"reservedFCTransfer":4,"reservedFCProcessing":134,"inboundShipped":0,"ps":40.1}]}},
            "B0B2KPMF7D":{"US":{"B06":[{"warehouseId":53,"warehouseName":"B06:US_FBA","availableQuantity":438,"reservedFCTransfer":711,"reservedFCProcessing":61,"inboundShipped":0,"ps":10.3},{"warehouseId":53,"warehouseName":"B06:US_FBA","availableQuantity":884,"reservedFCTransfer":7,"reservedFCProcessing":10,"inboundShipped":0,"ps":98.1}],"B24":[{"warehouseId":184,"warehouseName":"B24:US_FBA","availableQuantity":496,"reservedFCTransfer":3,"reservedFCProcessing":1,"inboundShipped":0,"ps":30.1}]}},
            "B09RG7HPRZ":{"CA":{"T005":[{"warehouseId":97,"warehouseName":"T005:CA_FBA","availableQuantity":493,"reservedFCTransfer":7,"reservedFCProcessing":14,"inboundShipped":0,"ps":23.4},{"warehouseId":97,"warehouseName":"T005:CA_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}]},"US":{"T005":[{"warehouseId":96,"warehouseName":"T005:US_FBA","availableQuantity":82,"reservedFCTransfer":0,"reservedFCProcessing":81,"inboundShipped":0,"ps":0},{"warehouseId":96,"warehouseName":"T005:US_FBA","availableQuantity":0,"reservedFCTransfer":0,"reservedFCProcessing":0,"inboundShipped":0,"ps":0}],"GA02":[{"warehouseId":2,"warehouseName":"GA02:US_FBA","availableQuantity":2,"reservedFCTransfer":0,"reservedFCProcessing":33,"inboundShipped":0,"ps":0}]}}}
const inventoryShortages = [{
  asin: "B0B4PW6ZKY",
  country: "US",
}, {
  asin: "B08M2HRV2W",
  country: "UK",
}, {
  asin: "B0B69VTXWX",
  country: "CA",
}];
const inventoryEnoughs = [{
  asin: "B0B2KPMF7D",
  country: "US",
}, {
  asin: "B09RG7HPRZ",
  country: "CA",
}];

const singleInventorys = [{
  asin: "B0B9V2J168",
  country: "US",
}, {
  asin: "B09RG7HPRZ",
  country: "CA",
}];

const multiInventorys = [{
  asin: "B0B2KPMF7D",
  country: "US",
}, {
  asin: "B0B69VTXWX",
  country: "CA",
}];

describe('checkProductsInventory', function() {
  describe('checkProductInventoryShortage', function() {
    it('should return true when product inventory is less than 10 days sals', async function () { 
      for (var inventoryShortage of inventoryShortages) {
        var data = await checkProductsInventory.getProductInventorySalesByCountry(listings[inventoryShortage.asin][inventoryShortage.country]);
        var status = await checkProductsInventory.checkProductInventoryShortage(data, 10);
        assert.equal(status.shortage, true);
      }
    });
    it('should return false when product inventory is more than 10 days sals', async function () {
      for (var inventoryEnough of inventoryEnoughs) {
        var data = await checkProductsInventory.getProductInventorySalesByCountry(listings[inventoryEnough.asin][inventoryEnough.country]);
        var status = await checkProductsInventory.checkProductInventoryShortage(data, 10);
        assert.equal(status.shortage, false);
      }
    });
  });
  describe('checkProductSingleInventory', function() {
    it('should return false when product has muli-accounts', async function () {
      for (var multiInventory of multiInventorys) {
        var data = await checkProductsInventory.getProductInventorySalesByCountry(listings[multiInventory.asin][multiInventory.country]);
        var single = await checkProductsInventory.checkProductSingleInventory(data, listings[multiInventory.asin], multiInventory.country);
        assert.equal(single, false);
      }
    });
    it('should return true when product has single-accounts', async function () {
      for (var singleInventory of singleInventorys) {
        var data = await checkProductsInventory.getProductInventorySalesByCountry(listings[singleInventory.asin][singleInventory.country]);
        var single = await checkProductsInventory.checkProductSingleInventory(data, listings[singleInventory.asin], singleInventory.country);
        assert.equal(single, true);
      }
    });
  });
})

