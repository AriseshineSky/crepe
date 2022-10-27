var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
ASIN_MAP = {
  'B0B69WKWFG': {
    plwhsId: 1374,
    yisucangId: 3090
  },
  'B0B69VTXWX': {
    plwhsId: 1373,
    yisucangId: 3089
  },
  'B09BNX7DB6': {
    plwhsId: 984,
    yisucangId: 3087
  }
};
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
PRODUCTS = {
  'B0B69WKWFG': {
    cycle: 20,
    unitsPerBox: 30,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 13.8
    }
  },
  'B0B69VTXWX': {
    cycle: 20,
    unitsPerBox: 30,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 13.8
    }
  },
  'B09BNX7DB6': {
    cycle: 20,
    unitsPerBox: 70,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 13.8
    },
    maxAvgSales: 120,
    inboundShippeds: [
      {
        quantity: 2800,
        deliveryDue: '2022-11-11'
      },
      {
        quantity: 2800,
        deliveryDue: '2022-11-20'
      }
    ]
  },
  'B091FZHF29': {
    cycle: 20,
    unitsPerBox: 30,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 13.8
    }
  },
  'B0BDPLFT94': {

  },
  'B0B5VW3MLD': {

  }
}
module.exports = app;
