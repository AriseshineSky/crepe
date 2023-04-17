const schedule = require("node-schedule");
let checkProductsInventory = require("../lib/checkProductsInventory");
let Product = require("../proxy").Product;
let Role = require("../proxy").Role;
let syncAllListings = require("../lib/syncAllListings");
const logger = require("../common/logger");

const scheduleCronstyle = () => {
	Role.init();
	schedule.scheduleJob("0 0 6 * * 1,3,5", () => {
		logger.info("start to check product inventory");
		// checkProductsInventory.checkProductsInventory();
	});
	checkProductsInventory.updateProductsInventory();
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to check product inventory");
		checkProductsInventory.updateProductsInventory();
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
		Product.updateProductDefaultCountries();
	});
	// Product.removeProductsWithoutAsinOrPlwhsId();
};

exports.initScheduledJobs = () => {
	scheduleCronstyle();
};
// checkProductsInventory.checkProductsInventory();
