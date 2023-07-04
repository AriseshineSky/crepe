const createError = require("http-errors");
const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const errorPageMiddleware = require("./middlewares/error_page");
const indexRouter = require("./routes/index");
const scheduledFunctions = require("./cron/checkInventoryScheduler");
const moment = require("moment");
const purchasesRouter = require("./routes/purchases");
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");
const deliveriesRouter = require("./routes/deliveries");
const shipmentTypesRouter = require("./routes/shipment_types");
const expressLayouts = require("express-ejs-layouts");
const auth = require("./middlewares/auth");
const app = express();
require("dotenv").config();
scheduledFunctions.initScheduledJobs();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(
	session({
		secret: "secret",
		resave: false,
		saveUninitialized: false,
	}),
);
const filteredPath = [
	"/users/login",
	"/users/api/login",
	"/users/register",
	"/users/api/register",
	"/users/change-password",
];

app.use(cookieParser());
app.use("/", async (req, res, next) => {
	console.log(req.path);
	res.locals.messages = {};
	res.locals.user = {};
	if (filteredPath.indexOf(req.path) > -1 || req.path.endsWith("showPlan")) {
		return next();
	}
	await auth()(req, res, next);
});
app.use(flash());
app.use(errorPageMiddleware.errorPage);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);
app.use("/", indexRouter);
app.use("/products", productsRouter);
app.use("/users", usersRouter);
app.use("/purchases", purchasesRouter);
app.use("/deliveries", deliveriesRouter);
app.use("/shipment_types", shipmentTypesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use("/js", express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")));
app.locals.moment = moment;
GAP = 6;
app.locals.GAP = GAP;
module.exports = app;
