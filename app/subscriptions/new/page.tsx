'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { subscriptionService } from '@/services/subscription.service';
import { subscriptionSchema, SubscriptionFormData } from '@/lib/validations';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50';

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      status: 'active',
      departments: [],
      teams: [],
      renewalReminderDays: [30, 7, 1],
    },
  });

  const { fields: deptFields, append: appendDept, remove: removeDept } = useFieldArray({ control, name: 'departments' as never });
  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({ control, name: 'teams' as never });
  const { fields: reminderFields, append: appendReminder, remove: removeReminder } = useFieldArray({ control, name: 'renewalReminderDays' as never });

  const [deptInput, setDeptInput] = useState('');
  const [teamInput, setTeamInput] = useState('');
  const [reminderInput, setReminderInput] = useState('');

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      setServerError('');
      await subscriptionService.create(data);
      router.push('/subscriptions');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create subscription');
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Subscription" description="Register a new software subscription" />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {serverError}
          </div>
        )}

        {/* Tool & Vendor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Tool Name</Label>
            <input {...register('toolName')} placeholder="e.g. Figma" className={inputCls} />
            <FieldError message={errors.toolName?.message} />
          </div>
          <div>
            <Label required>Vendor</Label>
            <input {...register('vendor')} placeholder="e.g. Figma Inc." className={inputCls} />
            <FieldError message={errors.vendor?.message} />
          </div>
        </div>

        {/* Plan */}
        <div>
          <Label>Plan</Label>
          <input {...register('plan')} placeholder="e.g. Professional" className={inputCls} />
          <FieldError message={errors.plan?.message} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <input type="date" {...register('startDate')} className={inputCls} />
            <FieldError message={errors.startDate?.message} />
          </div>
          <div>
            <Label required>Expiry Date</Label>
            <input type="date" {...register('expiryDate')} className={inputCls} />
            <FieldError message={errors.expiryDate?.message} />
          </div>
        </div>

        {/* Payment Cycle & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Payment Cycle</Label>
            <select {...register('paymentCycle')} className={inputCls}>
              <option value="">Select cycle</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select {...register('status')} className={inputCls}>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Licenses */}
        <div>
          <Label>Number of Licenses</Label>
          <input type="number" min={0} {...register('licenses', { valueAsNumber: true })} placeholder="e.g. 50" className={inputCls} />
          <FieldError message={errors.licenses?.message} />
        </div>

        {/* Owner */}
        <div>
          <Label required>Owner</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input {...register('owner.name')} placeholder="Owner name" className={inputCls} />
              <FieldError message={errors.owner?.name?.message} />
            </div>
            <div>
              <input {...register('owner.email')} placeholder="owner@company.com" className={inputCls} />
              <FieldError message={errors.owner?.email?.message} />
            </div>
          </div>
        </div>

        {/* Departments */}
        <div>
          <Label>Departments</Label>
          <div className="flex gap-2 mb-2">
            <input
              value={deptInput}
              onChange={(e) => setDeptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (deptInput.trim()) { appendDept(deptInput.trim() as never); setDeptInput(''); }
                }
              }}
              placeholder="Type and press Enter"
              className={inputCls}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (deptInput.trim()) { appendDept(deptInput.trim() as never); setDeptInput(''); } }}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {deptFields.map((field, i) => (
              <span key={field.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {watch(`departments.${i}` as never)}
                <button type="button" onClick={() => removeDept(i)} className="hover:text-red-600"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <Label>Teams</Label>
          <div className="flex gap-2 mb-2">
            <input
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (teamInput.trim()) { appendTeam(teamInput.trim() as never); setTeamInput(''); }
                }
              }}
              placeholder="Type and press Enter"
              className={inputCls}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (teamInput.trim()) { appendTeam(teamInput.trim() as never); setTeamInput(''); } }}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamFields.map((field, i) => (
              <span key={field.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                {watch(`teams.${i}` as never)}
                <button type="button" onClick={() => removeTeam(i)} className="hover:text-red-600"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Renewal reminder days */}
        <div>
          <Label>Renewal Reminder Days</Label>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={reminderInput}
              onChange={(e) => setReminderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = parseInt(reminderInput);
                  if (!isNaN(v) && v > 0) { appendReminder(v as never); setReminderInput(''); }
                }
              }}
              placeholder="Days before expiry"
              className={inputCls}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => {
              const v = parseInt(reminderInput);
              if (!isNaN(v) && v > 0) { appendReminder(v as never); setReminderInput(''); }
            }}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {reminderFields.map((field, i) => (
              <span key={field.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {watch(`renewalReminderDays.${i}` as never)} days
                <button type="button" onClick={() => removeReminder(i)} className="hover:text-red-600"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={() => router.push('/subscriptions')}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Subscription
          </Button>
        </div>
      </form>
    </div>
  );
}
