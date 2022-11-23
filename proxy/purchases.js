var models  = require('../models');
var plwhsPurchase  = require('../api/plwhs/purchases');
var Product = models.Product;
var mongoose = require('mongoose');
var moment = require('moment');
const GAP = 4;

async function formatPurchase(purchase) {
  return {
    orderId: `OR${purchase.id}`,
    qty: Number(purchase.qty),
    delivery: purchase.us_arrival_date,
    created: purchase.created
  }
}

async function getPurchasesByProductId(productId) {
  var purchases = [];
  var plwhsPurchases = await plwhsPurchase.purchases(productId);
  for(var purchase of plwhsPurchases) {
    if (purchase.status !== "canceled") {
      purchases.push(await formatPurchase(purchase));
    }
  }
  return purchases;
}

exports.getPurchasesByProductId = getPurchasesByProductId;

