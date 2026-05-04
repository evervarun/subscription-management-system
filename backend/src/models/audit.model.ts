import mongoose, { Schema, Document, Types } from 'mongoose';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'ownership_changed';

export interface IAuditLog extends Document {
  subscriptionId: Types.ObjectId;
  action: AuditAction;
  changedBy: { name: string; email: string; userId?: string };
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'status_changed', 'ownership_changed'],
    required: true,
  },
  changedBy: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: String },
  },
  changes: {
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ subscriptionId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
