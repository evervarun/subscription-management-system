import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';

export const auditController = {
  async getBySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await auditService.getBySubscriptionId(req.params.subscriptionId as string);
      res.json({ success: true, data: logs, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },
};
