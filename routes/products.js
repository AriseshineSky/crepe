var products = require("../controllers/products");
var express = require("express");
var router = express.Router();

router.get("/new", products.new);
router.get("/csv", products.csv);

router.get("/:productId/inbounds", products.showInbounds);
router.post("/:productId/inbounds", products.addInbound);
router.post("/:productId/inbound", products.updateInbound);
router.post("/:productId/updateAllStock", products.updateAllStockByAsin);
router.post("/:productId/inbound/:inboundId", products.deleteInbound);
router.post("/:productId/producing/:producingId", products.deleteProducing);
router.post("/:productId/producing", products.updateProducing);
router.post("/:productId/save", products.save);
router.get("/:productId/edit", products.edit);
router.get("/:productId/plan", products.plan);
router.get("/:productId/producing-plan", products.producingPlan);
router.get("/:productId/producings/plan", products.producingsPlan);
router.get("/:productId/producings/:producingId/plan", products.producingPlan);
router.get("/:productId/freights", products.freights);
router.get("/:productId/syncFreight", products.syncFreight);
router.get("/:productId/report", products.generateReport);
router.get("/:productId/showPlan", products.showPlan);
router.post("/:productId/plan", products.updatePlan);
router.post("/create", products.create);
router.get("/sync", products.sync);
router.get("/syncpm", products.syncpm);
router.get("/updateAllStock", products.updateAllStock);
router.get("/syncAllFreights", products.syncAllProductFreights);
router.post("/delete", products.delete);
router.get("/updateAllProuctSalesAndInventories", products.updateAllProuctSalesAndInventories);
router.get("/", products.index);
router.get("/:productId", products.show);
module.exports = router;
