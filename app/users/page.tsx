'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { userService, OrgUser } from '@/services/user.service';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { UserPlus, ShieldCheck, User, MoreVertical, ShieldOff, UserX, UserCheck } from 'lucide-react';

function RoleBadge({ role }: { role: 'admin' | 'member' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${role === 'admin'
      ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
      : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
      }`}>
      {role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${status === 'active'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : 'bg-slate-50 text-slate-500 ring-slate-200'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full ${colors[idx]} flex items-center justify-center text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

const emptyForm = { name: '', email: '', password: '', role: 'member' as 'admin' | 'member' };

/** Dropdown that closes when clicking outside */
function ActionsMenu({
  user,
  currentUserId,
  isLastAdmin,
  onToggleRole,
  onToggleStatus,
}: {
  user: OrgUser;
  currentUserId?: string;
  isLastAdmin: boolean;
  onToggleRole: (u: OrgUser) => void;
  onToggleStatus: (u: OrgUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const isSelf = user._id === currentUserId;
  // Disable demote/deactivate if this user is the only admin
  const canDemote = !(isLastAdmin && user.role === 'admin');
  const canDeactivate = !(isLastAdmin && user.role === 'admin');

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl border border-slate-100 shadow-lg py-1 animate-in slide-in-from-top-2 duration-150">
          {/* Role toggle */}
          <button
            onClick={() => { setOpen(false); onToggleRole(user); }}
            disabled={isSelf || !canDemote}
            title={!canDemote ? 'Cannot demote the last admin' : undefined}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {user.role === 'admin' ? <ShieldOff size={14} className="text-violet-500" /> : <ShieldCheck size={14} className="text-violet-500" />}
            Make {user.role === 'admin' ? 'Member' : 'Admin'}
            {!canDemote && <span className="ml-auto text-[10px] text-slate-400">last admin</span>}
          </button>
          {/* Status toggle */}
          <button
            onClick={() => { setOpen(false); onToggleStatus(user); }}
            disabled={isSelf || !canDeactivate}
            title={!canDeactivate ? 'Cannot deactivate the last admin' : undefined}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-slate-50"
          >
            {user.status === 'active'
              ? <UserX size={14} className="text-red-400" />
              : <UserCheck size={14} className="text-emerald-500" />
            }
            <span className={user.status === 'active' ? 'text-red-600' : 'text-emerald-700'}>
              {user.status === 'active' ? 'Deactivate' : 'Activate'}
            </span>
            {!canDeactivate && <span className="ml-auto text-[10px] text-slate-400">last admin</span>}
          </button>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      setPage(1);
      setUsers(await userService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await userService.add(form);
      setShowAddModal(false);
      setForm(emptyForm);
      await fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(u: OrgUser) {
    try {
      setActionError('');
      await userService.update(u._id, { status: u.status === 'active' ? 'inactive' : 'active' });
      await fetchUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async function toggleRole(u: OrgUser) {
    try {
      setActionError('');
      await userService.update(u._id, { role: u.role === 'admin' ? 'member' : 'admin' });
      await fetchUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    }
  }

  // Detect if there is only one admin in the org (used to disable demote/deactivate)
  const adminCount = users.filter(u => u.role === 'admin').length;

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage team members in your organization"
        action={isAdmin ? (
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus size={15} />
            Add User
          </Button>
        ) : undefined}
      />

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {/* Action error popup */}
      {actionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-white border border-red-200 shadow-lg rounded-2xl px-4 py-3 max-w-sm w-full mx-4 animate-in slide-in-from-top-2 duration-200">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-red-600 text-xs font-bold">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Action not allowed</p>
            <p className="text-xs text-slate-500 mt-0.5">{actionError}</p>
          </div>
          <button onClick={() => setActionError('')} className="text-slate-400 hover:text-slate-700 transition-colors shrink-0">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['User', 'Role', 'Status', 'Joined', ...(isAdmin ? ['Actions'] : [])].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedUsers.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.name} />
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5"><StatusDot status={u.status} /></td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end">
                          <ActionsMenu
                            user={u}
                            currentUserId={currentUser?.userId}
                            isLastAdmin={adminCount <= 1}
                            onToggleRole={toggleRole}
                            onToggleStatus={toggleStatus}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-5 py-16 text-center text-slate-400 text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {pagedUsers.map(u => (
              <div key={u._id} className="p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={u.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusDot status={u.status} />
                  {isAdmin && (
                    <ActionsMenu
                      user={u}
                      currentUserId={currentUser?.userId}
                      isLastAdmin={adminCount <= 1}
                      onToggleRole={toggleRole}
                      onToggleStatus={toggleStatus}
                    />
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No users found</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, users.length)}</span> of <span className="font-semibold">{users.length}</span> users
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add user modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setForm(emptyForm); setFormError(''); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Add Team Member</h2>
            <p className="text-sm text-slate-400 mb-5">Invite someone to your organization</p>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { label: 'Full name', field: 'name', type: 'text', placeholder: 'Alice Chen' },
                { label: 'Work email', field: 'email', type: 'email', placeholder: 'alice@company.com' },
                { label: 'Password', field: 'password', type: 'password', placeholder: 'Min. 8 characters' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    required
                    minLength={field === 'password' ? 8 : undefined}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'member' }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-slate-50 transition-all"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formError}</div>}
              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={submitting} className="flex-1 justify-center">
                  {submitting ? 'Adding…' : 'Add User'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowAddModal(false); setForm(emptyForm); setFormError(''); }} className="flex-1 justify-center  ">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
