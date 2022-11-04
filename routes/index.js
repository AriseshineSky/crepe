var express = require('express');
var router = express.Router();
var model = require('../models')
var urgen = require('../lib/urgent')
var checkProductsInventory = require('../lib/checkProductsInventory')

var marketAnalyze = require('../lib/marketAnalyze')
var getToken = require('../api/token')
var getAllListings = require('../api/getAllListings')
var getSellerAccounts = require('../lib/getSellerAccounts')
var fbaInventory = require('../api/fbaInventory')
var getYisucangProducts = require('../api/yisucang/products')
var getYisucangInventories = require('../api/yisucang/inventories')
var getPlwhsProductByASIN = require('../lib/getPlwhsProductByASIN')
var getInventoryByASIN = require('../lib/getFbaInventoryByASIN')
var getStockByASIN = require('../lib/getStockByASIN')

var plan = require('../lib/plan')

plwhsApis = {
  product: 'https://plwhs.com/api/Products?filter=%7B%22where%22:%7B%22appUserId%22:1%7D%7D',
  purchase: 'https://plwhs.com/api/StockOutRequests?filter=%7B%22where%22:%7B%22status%22:%22stocking_out%22%7D%7D'
}
yisucangApis = {
  inventory: '/OrderAPI/GetInventory',
  product: '/OrderAPI/GetProductList'
}
gerpgo_api_prefix = 'https://prodopenflat.apist.gerpgo.com/open-api'
open_apis = {
  token: '/api_token',
  sales: '/api/v2/finance/salesoperations/saleProfitDataGrid',
  listingAnalyze: '/api/v2/finance/salesoperations/listingAnalyze',
  selling: '/api/v2/channel/selling',
  detailSalesAndTraffic: '/api/v2/sale/businessReports/detailSalesAndTraffic',
  listingAnalyzeMultiIndex: '/api/v2/finance/salesoperations/listingAnalyzeMultiIndex',
  analysis: '/api/v2/channel/traffic/analysis',
  saleProfitDataGrid: '/api/v2/finance/salesoperations/saleProfitDataGrid',
  fbaInventory: '/api/v2/warehouse/fbaInventory',
  marketAnalyze: '/api/v2/finance/salesoperations/marketAnalyze'
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/regist', function(req, res, next) {
  checkProductsInventory()
  res.render('index', {title: "regist"});
})

router.get('/check', function(req, res, next) {
  checkProductsInventory();
  res.render('index', {title: "regist"});
})

router.get('/inventory', async function(req, res, next) {
  var inventory = await getInventoryByASIN(getToken, 'B0B69WKWFG');
  console.log(inventory);
  res.render('inventory', {inventory: inventory});
})

router.get('/stock', async function(req, res, next) {
  var stock = await getStockByASIN('B091FZHF29');
  res.render('stock', {stock: stock});
})



router.get('/plan', async function(req, res, next) {
  var purchase = await plan('B091FZHF29');
  console.log(purchase);
  res.render('plan', {purchase: purchase, freight: FREIGHT});
})

module.exports = router;
