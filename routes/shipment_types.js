const shipmentType = require("../controllers/freights");
const express = require("express");
const router = express.Router();

router.get("/list", shipmentType.list);
router.get("/sync", shipmentType.sync);
router.get("/syncAll", shipmentType.syncAll);

module.exports = router;
