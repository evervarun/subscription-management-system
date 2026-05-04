import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  planType: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrgSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    planType: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'professional',
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrgSchema);
