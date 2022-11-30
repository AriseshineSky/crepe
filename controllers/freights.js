var Freight = require('../proxy').Freight;

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