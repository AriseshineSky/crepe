const shipmentType = require("../controllers/shipment_types");
const express = require("express");
const router = express.Router();

router.get("/index", shipmentType.list);
router.get("/sync", shipmentType.sync);

module.exports = router;
