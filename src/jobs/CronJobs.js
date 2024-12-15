const cron = require('node-cron');
const ReminderService = require('../services/ReminderService');

const startEventReminderJob = () => {
  console.log('Initializing event reminder cron job...');
  cron.schedule('40 23 * * *', async () => {
    console.log('Running event reminder cron job...');
    try {
      await ReminderService.sendEventReminders();
      console.log('Event reminder job completed successfully');
    } catch (error) {
      console.error('Error in event reminder job:', error);
    }
  });
};

module.exports = startEventReminderJob;