var purchases = require("../controllers/purchases");
var express = require("express");
var router = express.Router();

router.get("/index", purchases.index);
router.get("/new", purchases.new);
router.post("/:purchaseId/save", purchases.save);
router.post("/create", purchases.create);
router.post("/delete", purchases.delete);
router.get("/", purchases.index);
module.exports = router;
