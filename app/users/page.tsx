'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { userService, OrgUser } from '@/services/user.service';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';

function RoleBadge({ role }: { role: 'admin' | 'member' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
      }`}>
      {role}
    </span>
  );
}

const emptyForm = { name: '', email: '', password: '', role: 'member' as 'admin' | 'member' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
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
    await userService.update(u._id, { status: u.status === 'active' ? 'inactive' : 'active' });
    await fetchUsers();
  }

  async function toggleRole(u: OrgUser) {
    await userService.update(u._id, { role: u.role === 'admin' ? 'member' : 'admin' });
    await fetchUsers();
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Users"
        description="Manage team members in your organization"
        action={isAdmin ? (
          <Button onClick={() => setShowAddModal(true)}>+ Add User</Button>
        ) : undefined}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4">
                    <StatusBadge status={u.status === 'active' ? 'active' : 'cancelled'} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={u._id === currentUser?.userId}
                        className="text-xs text-indigo-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Make {u.role === 'admin' ? 'Member' : 'Admin'}
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={u._id === currentUser?.userId}
                        className="text-xs text-gray-500 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowAddModal(false); setForm(emptyForm); setFormError(''); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { label: 'Name', field: 'name', type: 'text', placeholder: 'Alice Chen' },
                { label: 'Email', field: 'email', type: 'email', placeholder: 'alice@company.com' },
                { label: 'Password', field: 'password', type: 'password', placeholder: 'Min. 8 characters' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    required
                    minLength={field === 'password' ? 8 : undefined}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'member' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{formError}</div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Adding…' : 'Add User'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setShowAddModal(false); setForm(emptyForm); setFormError(''); }}
                  className="flex-1"
                >
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
