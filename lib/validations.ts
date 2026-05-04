import { z } from 'zod';

export const subscriptionSchema = z.object({
  toolName: z.string().min(1, 'Tool name is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  plan: z.string().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  paymentCycle: z.enum(['monthly', 'quarterly', 'annual', 'one-time']).optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).default('active'),
  licenses: z.coerce.number().min(0).optional(),
  departments: z.array(z.string()).default([]),
  teams: z.array(z.string()).default([]),
  owner: z.object({
    name: z.string().min(1, 'Owner name is required'),
    email: z.string().email('Valid email required'),
  }),
  renewalReminderDays: z.array(z.coerce.number()).default([30, 7, 1]),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
