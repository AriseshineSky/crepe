const deliveries = require("../controllers/deliveries");
const express = require("express");
const router = express.Router();

router.get("/", deliveries.index);
routes.post("/create", deliveries.create);
module.exports = router;
