const schedule = require("node-schedule");
let checkProductsInventory = require("../lib/checkProductsInventory");
let Product = require("../proxy").Product;
let Yisucang = require("../proxy").Yisucang;
let Delivery = require("../proxy").Delivery;
let User = require("../proxy").User;
let Role = require("../proxy").Role;
let syncAllListings = require("../lib/syncAllListings");
// let lotDetail = require("../lib/lotDetail");
// let syncLotPageList = require("../lib/syncLotPageList");
let syncProcureItem = require("../lib/syncProcureItem");
let syncPurchaseDetails = require("../lib/syncPurchasesDetail");
// let syncPurchaseOrders = require("../lib/syncPurchaseOrders");
let syncYisucangInbounds = require("../lib/syncYisucangInbounds");
let syncPurchases = require("../lib/syncPurchases");
// let syncSupplierSku = require("../lib/syncSupplierSku");
// let syncSupplier = require("../lib/syncSupplier");
let syncDeliveries = require("../lib/syncDeliveries");
const syncProductInfo = require("../lib/syncProductInfo");
const logger = require("../common/logger");
let syncProducts = require("../lib/getInfoFromGoogleSheet");

const scheduleCronstyle = () => {
	User.checkAdmin();

	// syncPurchaseDetails.syncPurchasesDetail();
	// Delivery.updateDeliveryPurchaseId();
	// syncDeliveries.syncDeliveries();
	// syncProcureItem.syncProcureItems();
	//	syncPurchases.syncPurchaseProcures();

	// schedule.scheduleJob("0 0 6 * * 1,3,5", () => {
	// 	logger.info("start to check product inventory");
	// 	checkProductsInventory.checkProductsInventory();
	// });
	//
	schedule.scheduleJob("0 */3 * * * *", () => {
		logger.info("start to sync product inventory");
		syncYisucangInbounds.syncYisucangInbounds();
	});
	// schedule.scheduleJob("0 */5 * * * *", () => {
	// 	logger.info("start to sync product inventory");
	// 	Delivery.updateDeliveryReciveds();
	// });
	// schedule.scheduleJob("0 */3 * * * *", () => {
	// 	logger.info("start to sync product inventory");
	// 	Delivery.updateRemainingArrivalDays();
	// });
	//
	schedule.scheduleJob("0 */10 * * * *", () => {
		logger.info("start to sync product inventory");
		syncPurchases.syncPurchaseProcures();
	});
	schedule.scheduleJob("0 */10 * * * *", () => {
		logger.info("start to sync product inventory");
		syncDeliveries.syncDeliveries();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to sync product inventory");
		syncPurchaseDetails.syncPurchasesDetail();
	});

	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to sync product inventory");
		Yisucang.syncYisucang();
	});
	// schedule.scheduleJob("0 0 */1 * * *", () => {
	// 	logger.info("start to update lisings");
	// 	syncProducts.syncProducts();
	// });
	//
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update lisings");
		// syncAllListings.syncListings();
	});

	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product stocks");
		Product.updateAll();
	});
	schedule.scheduleJob("0 0 */1 * * *", () => {
		logger.info("start to update product stocks");
		Product.syncPm();
	});
};

exports.initScheduledJobs = () => {
	scheduleCronstyle();
};
