export interface AuditLog {
  _id: string;
  subscriptionId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'ownership_changed';
  changedBy: { name: string; email: string; userId?: string };
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  timestamp: string;
}
