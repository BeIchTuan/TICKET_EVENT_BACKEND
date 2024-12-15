const startEventReminderJob = require('./CronJobs');

const initializeJobs = () => {
  console.log('Initializing all cron jobs...');
  startEventReminderJob();
};

module.exports = initializeJobs;
