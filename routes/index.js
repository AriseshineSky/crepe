var express = require("express");
var router = express.Router();
var checkProductsInventory = require("../lib/checkProductsInventory");
var syncAllListings = require("../lib/syncAllListings");

yisucangApis = {
	inventory: "/OrderAPI/GetInventory",
	product: "/OrderAPI/GetProductList",
};
gerpgo_api_prefix = "https://prodopenflat.apist.gerpgo.com/open-api";
open_apis = {
	token: "/api_token",
	sales: "/api/v2/finance/salesoperations/saleProfitDataGrid",
	listingAnalyze: "/api/v2/finance/salesoperations/listingAnalyze",
	selling: "/api/v2/channel/selling",
	detailSalesAndTraffic: "/api/v2/sale/businessReports/detailSalesAndTraffic",
	listingAnalyzeMultiIndex: "/api/v2/finance/salesoperations/listingAnalyzeMultiIndex",
	analysis: "/api/v2/channel/traffic/analysis",
	saleProfitDataGrid: "/api/v2/finance/salesoperations/saleProfitDataGrid",
	fbaInventory: "/api/v2/warehouse/fbaInventory",
	marketAnalyze: "/api/v2/finance/salesoperations/marketAnalyze",
};

/* GET home page. */
router.get("/", function (req, res, next) {
	res.render("index", { title: "login" });
});

router.get("/check", async function (req, res, next) {
	await checkProductsInventory.checkProductsInventory();
	res.render("index", { title: "regist" });
});

router.get("/syncListings", async function (req, res, next) {
	await syncAllListings.syncListings();
	res.render("index", { title: "regist" });
});

module.exports = router;
