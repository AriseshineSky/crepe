const schedule = require("node-schedule");
let checkProductsInventory = require("../lib/checkProductsInventory");
let Product = require("../proxy").Product;
let Yisucang = require("../proxy").Yisucang;
let Delivery = require("../proxy").Delivery;
let Role = require("../proxy").Role;
let syncAllListings = require("../lib/syncAllListings");
let lotDetail = require("../lib/lotDetail");
let syncLotPageList = require("../lib/syncLotPageList");
let syncProcureItem = require("../lib/syncProcureItem");
let syncPurchaseDetails = require("../lib/syncPurchaseOrderDetails");
let syncPurchaseOrders = require("../lib/syncPurchaseOrders");
let syncSupplierSku = require("../lib/syncSupplierSku");
let syncDeliveries = require("../lib/syncDeliveries");
let syncProductInfo = require("../lib/syncProductInfo");
const logger = require("../common/logger");
let syncProducts = require("../lib/getInfoFromGoogleSheet");

const scheduleCronstyle = () => {
	syncProductInfo.syncProductInfo();
	// Delivery.updateDeliveryPurchaseId();
	// syncPurchaseOrders.syncPurchaseOrders();
	// syncDeliveries.syncDeliveries();
	// syncPurchaseDetails.syncPurchaseOrderDetails();
	// lotDetail.syncLotNoDetails();
	// syncLotPageList.syncPageList();
	// syncProcureItem.syncProcureItems();
	schedule.scheduleJob("0 0 6 * * 1,3,5", () => {
		logger.info("start to check product inventory");
		checkProductsInventory.checkProductsInventory();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to sync product inventory");
		syncPurchaseOrders.syncPurchaseOrders();
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
