var models  = require('../models');
var plwhsPurchase  = require('../api/plwhs/purchases');
var Product = models.Product;
var mongoose = require('mongoose');
var moment = require('moment');
const GAP = 4;
var getFbaInventoryByASIN = require('../lib/getFbaInventoryByASIN')
var getStockByProduct = require('../lib/getStockByProduct');
const { ObjectId } = require('mongodb');

var inboundQueue = [];

async function formatPurchase(purchase) {
  return {
    orderId: `OR${purchase.id}`,
    qty: purchase.qty
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

