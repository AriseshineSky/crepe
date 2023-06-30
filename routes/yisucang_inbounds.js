const yisucangInbounds = require("../controllers/deliveries");
const express = require("express");
const router = express.Router();

router.get("/", yisucangInbounds.index);
routes.post("/create", yisucangInbounds.create);
module.exports = router;
