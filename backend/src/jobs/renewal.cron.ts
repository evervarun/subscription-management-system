import cron from 'node-cron';
import { statusService } from '../services/status.service';
import { notificationService } from '../services/notification.service';
import { logger } from '../lib/logger';

export function startCronJobs() {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Cron] Daily job started');
    try {
      const expired = await statusService.syncExpiredStatuses();
      logger.info(`[Cron] Expired subscriptions synced: ${expired}`);
    } catch (err) {
      logger.error('[Cron] syncExpiredStatuses failed', err);
    }

    try {
      const alerts = await notificationService.checkRenewals();
      logger.info(`[Cron] Renewal alerts sent: ${alerts}`);
    } catch (err) {
      logger.error('[Cron] checkRenewals failed', err);
    }

    logger.info('[Cron] Daily job completed');
  });

  logger.info('[Cron] Jobs scheduled — daily at 09:00');
}
