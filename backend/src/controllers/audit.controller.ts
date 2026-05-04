import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';

export const auditController = {
  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const logs = await auditService.getRecentByOrg(organizationId);
      res.json({ success: true, data: logs, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },

  async getBySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await auditService.getBySubscriptionId(req.params.subscriptionId as string);
      res.json({ success: true, data: logs, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },
};
