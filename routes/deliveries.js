const deliveries = require("../controllers/deliveries");
const express = require("express");
const router = express.Router();

router.get("/index", deliveries.index);
router.get("/new", deliveries.new);
router.post("/create", deliveries.create);
router.post("/deliveryId", deliveries.show);
router.post("/delete", deliveries.delete);
router.get("/", deliveries.index);
module.exports = router;
