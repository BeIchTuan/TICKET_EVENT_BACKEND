const cron = require('node-cron');
const ReminderService = require('../services/ReminderService');

const startEventReminderJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('Running event reminder cron job...');
    try {
      await ReminderService.sendEventReminders();
      console.log('Event reminder job completed successfully');
    } catch (error) {
      console.error('Error in event reminder job:', error);
    }
  });
  console.log('Initialied event reminder cron job');
};

module.exports = startEventReminderJob;