import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const createSubscriptionSchema = z.object({
  toolName: z.string().min(1, 'Tool name is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  plan: z.string().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  paymentCycle: z.enum(['monthly', 'quarterly', 'annual', 'one-time']).optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending', 'trial', 'paused']).default('active'),
  licenses: z.number().min(0).optional(),
  departments: z.array(z.string()).default([]),
  teams: z.array(z.string()).default([]),
  owner: z.object({
    name: z.string().min(1, 'Owner name is required'),
    email: z.string().email('Valid email required'),
    userId: z.string().optional(),
  }),
  renewalReminderDays: z.array(z.number()).default([30, 7, 1]),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }
    req.body = result.data;
    next();
  };
}
