const schedule = require("node-schedule");
let checkProductsInventory = require("../lib/checkProductsInventory");
let Product = require("../proxy").Product;
let Yisucang = require("../proxy").Yisucang;
let Role = require("../proxy").Role;
let syncAllListings = require("../lib/syncAllListings");
let syncPurchaseOrders = require("../lib/syncPurchaseOrders");
const logger = require("../common/logger");
let syncProducts = require("../lib/getInfoFromGoogleSheet");

const scheduleCronstyle = () => {
	syncPurchaseOrders.syncPurchaseOrders();
	schedule.scheduleJob("0 0 6 * * 1,3,5", () => {
		logger.info("start to check product inventory");
		checkProductsInventory.checkProductsInventory();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to sync product inventory");
		Yisucang.syncYisucang();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product sales and inventories");
		Product.updateAllProductSalesAndInventories();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product freights");
		Product.syncAllProductFreights(10);
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update lisings");
		syncAllListings.syncListings();
		syncProducts.syncProducts();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product stocks");
		Product.updateAllStock();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product pm");
		Product.updateProductDefaultCountries();
	});
};

exports.initScheduledJobs = () => {
	scheduleCronstyle();
};
// checkProductsInventory.checkProductsInventory();
