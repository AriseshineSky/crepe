var Freight = require('../proxy').Freight;
var Product = require('../proxy').Product;

exports.list = async function (req, res, next) {
  var freights = await Freight.syncFreights();
};

exports.types = async function (req, res, next) {
  var freightTypes = await Freight.freightTypes();
  res.render('freight/index', {
    freightTypes: freightTypes
  });
};
exports.sync = async function (req, res, next) {
  await Freight.syncFreightTypes();
  res.redirect('/freights/types');
};
exports.syncAll = async function (req, res, next) {
  await Product.syncAllProductFreights(2);
  res.redirect('/freights/types');
};