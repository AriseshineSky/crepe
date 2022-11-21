const schedule = require('node-schedule');
var checkProductsInventory = require('../lib/checkProductsInventory');

const scheduleCronstyle = ()=>{
  schedule.scheduleJob('0 0 1 * * *', () => {
    checkProductsInventory.checkProductsInventory();
  });
}

exports.initScheduledJobs = () => {
  scheduleCronstyle();
}
