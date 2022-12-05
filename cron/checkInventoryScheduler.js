const schedule = require('node-schedule');
var checkProductsInventory = require('../lib/checkProductsInventory');
var Product = require('../proxy').Product;
var freights = require('../proxy/freight');
var syncAllListings = require('../lib/syncAllListings');

const scheduleCronstyle = ()=>{
  schedule.scheduleJob('0 0 1 * * *', () => {
    checkProductsInventory.checkProductsInventory();
  });
  schedule.scheduleJob('0 0 */6 * * *', () => {
    Product.syncAllProductFreights(2);
  });
  schedule.scheduleJob('0 0 */4 * * *', () => {
    syncAllListings.syncListings();
  });
  schedule.scheduleJob('0 0 */8 * * *', () => {
    Product.updateAllStock();
  });
}

exports.initScheduledJobs = () => {
  scheduleCronstyle();
}
