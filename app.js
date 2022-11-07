var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var errorPageMiddleware = require('./middlewares/error_page');
var indexRouter = require('./routes/index');
var productsRouter = require('./routes/products');
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
app.use('/products', productsRouter);

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
  },
  'B0BH67C4MB': {
    plwhsId: 1390,
    yisucangId: 3091
  },
  'B09RG7HPRZ': {
    plwhsId: 1011,
    yisucangId: 6178
  },
  'B09BXWFYWC': {
    plwhsId: 1010,
    yisucangId: 3118
  },
  'B09C41RBVG': {
    plwhsId: 1173,
    yisucangId: 3116
  },
  'B0B98XCZFX': {
    plwhsId: 1491,
    yisucangId: 6162
  },
  'B0B4PW6ZKY': {
    plwhsId: 1372,
    yisucangId: 6095
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
  // airDelivery: {
  //   period: 15,
  //   price: 32
  // },
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
    minInventory: 300,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 13.8
    },
    maxAvgSales: 45,
    inboundShippeds: [
    ]
  },
  'B0B69VTXWX': {
    cycle: 20,
    unitsPerBox: 30,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 12.8
    },
    maxAvgSales: 20,
    inboundShippeds: [
    ]
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
        deliveryDue: '2022-11-7'
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
    },
    maxAvgSales: 150,
    inboundShippeds: [
      {
        quantity: 6000,
        deliveryDue: '2022-11-11'
      }
    ]
  },
  'B0BDPLFT94': {
    cycle: 5,
    unitsPerBox: 98,
    boxD: {
      l: 50,
      w: 30,
      h: 30,
      wt: 5
    },
    maxAvgSales: 100,
    inboundShippeds: [
      {
        quantity: 4500,
        deliveryDue: '2022-11-11'
      }
    ]
  },
  'B0B5VW3MLD': {
    cycle: 5,
    unitsPerBox: 150,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 5
    },
    maxAvgSales: 100,
    inboundShippeds: [
      
    ]
  },
  'B0B5VW3MLD': {
    cycle: 5,
    unitsPerBox: 150,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 5
    },
    maxAvgSales: 100,
    inboundShippeds: [
      
    ]
  },
  'B0B5VW3MLD': {
    cycle: 5,
    unitsPerBox: 150,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 5
    },
    maxAvgSales: 100,
    inboundShippeds: [
      
    ]
  },
  'B0B5VW3MLD': {
    cycle: 5,
    unitsPerBox: 150,
    boxD: {
      l: 50,
      w: 40,
      h: 30,
      wt: 5
    },
    maxAvgSales: 100,
    inboundShippeds: [
      
    ]
  },
  'B0BH67C4MB': {
    cycle: 12,
    unitsPerBox: 250,
    boxD: {
      l: 50,
      w: 40,
      h: 50,
      wt: 11.38
    },
    maxAvgSales: 40,
    inboundShippeds: [
      {
        quantity: 750,
        deliveryDue: '2022-11-11'
      },
      {
        quantity: 750,
        deliveryDue: '2022-11-30'
      }
    ]
  },
  'B09RG7HPRZ': {
    cycle: 30,
    unitsPerBox: 100,
    boxD: {
      l: 44.5,
      w: 23.5,
      h: 27.5,
      wt: 14.4
    },
    maxAvgSales: 40,
    inboundShippeds: [
      {
        quantity: 1500,
        deliveryDue: '2022-11-24'
      }
    ]
  },
  'B09BXWFYWC': {
    cycle: 30,
    unitsPerBox: 450,
    boxD: {
      l: 48,
      w: 31,
      h: 46,
      wt: 12.37
    },
    maxAvgSales: 40,
    inboundShippeds: [
      
    ]
  },
  'B09C41RBVG': {
    cycle: 15,
    unitsPerBox: 150,
    boxD: {
      l: 48,
      w: 29.7,
      h: 33.5,
      wt: 13.26
    },
    maxAvgSales: 90,
    inboundShippeds: [
      
    ]
  },
  'B0B98XCZFX': {
    cycle: 5,
    unitsPerBox: 120,
    boxD: {
      l: 36.4,
      w: 23,
      h: 30.8,
      wt: 12.8
    },
    maxAvgSales: 150,
    inboundShippeds: [
      {
        quantity: 1350,
        deliveryDue: '2022-11-13'
      }
    ]
  },
  'B0B4PW6ZKY': {
    cycle: 35,
    unitsPerBox: 600,
    boxD: {
      l: 50.5,
      w: 46,
      h: 26.25,
      wt: 13.4
    },
    maxAvgSales: 250,
    inboundShippeds: [
      {
        quantity: 10000,
        deliveryDue: '2022-11-30'
      }
    ]
  }
}
module.exports = app;
