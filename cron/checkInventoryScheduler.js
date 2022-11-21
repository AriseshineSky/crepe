const schedule = require('node-schedule');
var checkProductsInventory = require('../lib/checkProductsInventory');

const scheduleCronstyle = ()=>{
  schedule.scheduleJob('0 6 * * * *', () => {
    checkProductsInventory.checkProductsInventory();
  });
}

exports.initScheduledJobs = () => {
  scheduleCronstyle();
}
