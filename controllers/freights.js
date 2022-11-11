var Freight = require('../proxy').Freight;

exports.list = async function (req, res, next) {
  var freights = await Freight.syncFreights();

};
