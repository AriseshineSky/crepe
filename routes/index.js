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
var getStockByProduct = require('../lib/getStockByProduct')


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
  res.redirect('/products');
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
  var stock = await getStockByProduct('B091FZHF29');
  res.render('stock', {stock: stock});
})


module.exports = router;
