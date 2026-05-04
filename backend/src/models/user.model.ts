import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'inactive';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: Types.ObjectId;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ organizationId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
