const schedule = require("node-schedule");
var checkProductsInventory = require("../lib/checkProductsInventory");
var Product = require("../proxy").Product;
var freights = require("../proxy/freight");
var syncAllListings = require("../lib/syncAllListings");
var generateProduct = require("../lib/generateProductByListing");
const logger = require("../common/logger");

const scheduleCronstyle = () => {
	schedule.scheduleJob("0 0 6 * * 1,3,5", () => {
		logger.info("start to check product inventory");
		checkProductsInventory.checkProductsInventory();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product sales and inventories");
		Product.updateAllProuctSalesAndInventories();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product freights");
		Product.syncAllProductFreights(10);
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update lisings");
		syncAllListings.syncListings();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product stocks");
		Product.updateAllStock();
	});

	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product pm");
		Product.syncPm();
		Product.syncFromPlwhs();
	});
};

exports.initScheduledJobs = () => {
	scheduleCronstyle();
};
// checkProductsInventory.checkProductsInventory();
