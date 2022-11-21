var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var errorPageMiddleware = require('./middlewares/error_page');
var indexRouter = require('./routes/index');
const scheduledFunctions = require('./cron/checkInventoryScheduler');

var productsRouter = require('./routes/products');
var freightsRouter = require('./routes/freights');
var expressLayouts = require('express-ejs-layouts');
var app = express();
scheduledFunctions.initScheduledJobs();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(errorPageMiddleware.errorPage);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/freights', freightsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
FREIGHT = {
  sea: {
    period: 45,
    price: 9
  },
  seaExpress: {
    period: 35,
    price: 15
  },
  airDelivery: {
    period: 15,
    price: 32
  },
  airExpress: {
    period: 8,
    price: 55
  }
};

module.exports = app;
