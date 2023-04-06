var users = require("../controllers/users");
var express = require("express");
var router = express.Router();

router.post("/api/register", users.create);
router.get("/register", users.showRegister);
router.get("/api/users", users.list);
router.get("/login", users.showLogin);
router.post("/login", users.login);

module.exports = router;
