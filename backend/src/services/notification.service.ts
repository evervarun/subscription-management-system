import { subscriptionRepository } from '../repositories/subscription.repository';
import { logger } from '../lib/logger';

const REMINDER_DAYS = [60, 30, 14, 7, 3, 1];

export const notificationService = {
  async checkRenewals() {
    let alertCount = 0;

    for (const days of REMINDER_DAYS) {
      const subs = await subscriptionRepository.findActiveWithReminderDays(days);
      for (const sub of subs) {
        logger.warn(
          `[Renewal Alert] "${sub.toolName}" by ${sub.vendor} expires in ${days} day(s). Owner: ${sub.owner.name} <${sub.owner.email}>`
        );
        alertCount++;
      }
    }

    logger.info(`[Notifications] Checked renewals — ${alertCount} alert(s) triggered`);
    return alertCount;
  },
};
