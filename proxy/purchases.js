var models  = require('../models');
var plwhsPurchase  = require('../api/plwhs/purchases');
var Product = models.Product;
var mongoose = require('mongoose');
var moment = require('moment');
const GAP = 4;

async function formatPurchase(purchase) {
  return {
    orderId: `OR${purchase.id}`,
    qty: purchase.qty,
    delivery: purchase.us_arrival_date
  }
}

async function getPurchasesByProductId(productId) {
  var purchases = [];
  var plwhsPurchases = await plwhsPurchase.purchases(productId);
  for(var purchase of plwhsPurchases) {
    purchases.push(await formatPurchase(purchase));
  }
  return purchases;
}

exports.getPurchasesByProductId = getPurchasesByProductId;

