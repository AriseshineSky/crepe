var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var errorPageMiddleware = require('./middlewares/error_page');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var expressLayouts = require('express-ejs-layouts');

var app = express();

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

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
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
  },
  'B091FZHF29': {
    plwhsId: 814,
    yisucangId: 5159
  },
  'B0BDPLFT94': {
    plwhsId: 1317,
    yisucangId: 3143
  },
  'B0B5VW3MLD': {
    plwhsId: 1172,
    yisucangId: 3119
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
YISUCANG_ID_KEYS = [
  {
    PartnerID: '96648968',
    PartnerKey: '7fd301de-7d58-388f-044a-74ef521b18c5'
  },
  {
    PartnerID: '58176925',
    PartnerKey: '4cd81d9e-5f2c-dcd9-ed5e-d70039cdafd7'
  },
  {
    PartnerID: '18464347',
    PartnerKey: '657d40e7-0776-9a35-c12d-b6768aa4f699'
  },
  {
    PartnerID: '62593998',
    PartnerKey: '4febe1b9-096a-3ce0-cf2c-897bbbf95ce3'
  }
]
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
    cycle: 5,
    unitsPerBox: 143,
    boxD: {
      l: 50,
      w: 30,
      h: 30,
      wt: 11.8
    }
  },
  'B0BDPLFT94': {
    cycle: 5,
    unitsPerBox: 98,
    boxD: {
      l: 50,
      w: 30,
      h: 30,
      wt: 5
    }
  },
  'B0B5VW3MLD': {
    cycle: 5,
    unitsPerBox: 150,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 5
    }
  }
}
module.exports = app;
