const schedule = require('node-schedule');

// 定义规则
let rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.minute = 0;
rule.second = 0;


// 启动任务
let job = schedule.scheduleJob(rule, () => {
  console.log('job schedule', new Date());
});