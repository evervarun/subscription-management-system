import { subscriptionRepository } from '../repositories/subscription.repository';
import { auditService } from './audit.service';
import { logger } from '../lib/logger';

export const statusService = {
  async syncExpiredStatuses() {
    const expired = await subscriptionRepository.findExpiredActive();
    if (expired.length === 0) {
      logger.info('[StatusSync] No subscriptions to expire');
      return 0;
    }

    for (const sub of expired) {
      await subscriptionRepository.update(String(sub._id), { status: 'expired' } as never);
      await auditService.log(String(sub._id), 'status_changed', undefined, {
        before: { status: 'active' },
        after: { status: 'expired' },
      });
      logger.info(`[StatusSync] Marked expired: ${sub.toolName} (${sub.vendor})`);
    }

    logger.info(`[StatusSync] Synced ${expired.length} subscriptions to expired`);
    return expired.length;
  },
};
