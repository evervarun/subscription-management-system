import { z } from 'zod';

export const subscriptionSchema = z.object({
  toolName: z.string().min(1, 'Tool name is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  plan: z.string().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  paymentCycle: z.enum(['monthly', 'quarterly', 'annual', 'one-time']).optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending', 'trial', 'paused']),
  licenses: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  departments: z.array(z.string()),
  teams: z.array(z.string()),
  owner: z.object({
    name: z.string().min(1, 'Owner name is required'),
    email: z.string().email('Valid email required'),
  }),
  renewalReminderDays: z.array(z.coerce.number()),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
