const deliveries = require("../controllers/deliveries");
const express = require("express");
const router = express.Router();

router.get("/", deliveries.index);
module.exports = router;
