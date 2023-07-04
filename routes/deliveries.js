const deliveries = require("../controllers/deliveries");
const express = require("express");
const router = express.Router();

router.get("/index", deliveries.index);
router.get("/new", deliveries.new);
router.post("/create", deliveries.create);
router.post("/delete", deliveries.delete);
router.get("/:deliveryId/edit", deliveries.edit);
router.get("/:deliveryId/show", deliveries.show);
router.get("/:deliveryId", deliveries.show);
router.get("/", deliveries.index);
module.exports = router;
