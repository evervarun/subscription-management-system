import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';

export const subscriptionController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.createSubscription(req.body);
      res.status(201).json({ success: true, data: subscription, message: 'Subscription created' });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, department, page = '1', limit = '10' } = req.query as Record<string, string>;
      const result = await subscriptionService.getSubscriptions(
        { status, department },
        parseInt(page),
        parseInt(limit)
      );
      res.json({ success: true, data: result.data, total: result.total, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.getById(req.params.id as string);
      res.json({ success: true, data: subscription, message: 'OK' });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.updateSubscription(req.params.id as string, req.body);
      res.json({ success: true, data: subscription, message: 'Subscription updated' });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await subscriptionService.deleteSubscription(req.params.id as string);
      res.json({ success: true, data: null, message: 'Subscription deleted' });
    } catch (err) {
      next(err);
    }
  },
};
