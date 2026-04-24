import { useState, useEffect, useCallback } from "react";
import { Search, UserX, UserCheck, Trash2, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";
import { adminFetch } from "../../utils/adminApi";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

const planBadge = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-indigo-50 text-indigo-600",
  max: "bg-purple-50 text-purple-600",
};

const statusBadge = {
  active: "bg-emerald-50 text-emerald-600",
  inactive: "bg-rose-50 text-rose-600",
};

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 15 });
      if (search) params.set("search", search);
      const res = await adminFetch(`/admin/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  async function viewUser(userId) {
    setDetailLoading(true);
    try {
      const res = await adminFetch(`/admin/users/${userId}`);
      setSelectedUser(res);
    } catch {}
    setDetailLoading(false);
  }

  async function toggleBlock(userId, currentStatus) {
    const endpoint = currentStatus === "active" ? "block" : "unblock";
    try {
      await adminFetch(`/admin/users/${userId}/${endpoint}`, { method: "PATCH" });
      fetchUsers();
      if (selectedUser?.user_id === userId) viewUser(userId);
    } catch {}
  }

  async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await adminFetch(`/admin/users/${userId}`, { method: "DELETE" });
      fetchUsers();
      if (selectedUser?.user_id === userId) setSelectedUser(null);
    } catch {}
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">View, search, and manage all registered users</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white shadow-sm py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">{total} users</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Files</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-slate-500">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${planBadge[u.plan] || planBadge.free}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge[u.status] || statusBadge.active}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs font-medium">{formatBytes(u.storage_used)}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs font-medium">{u.total_files}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => viewUser(u.user_id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleBlock(u.user_id, u.status)}
                        className={`rounded-lg p-2 transition ${u.status === "active" ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                        title={u.status === "active" ? "Block" : "Unblock"}
                      >
                        {u.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button onClick={() => deleteUser(u.user_id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600 shadow-sm border border-indigo-100">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
              {[
                { label: "Plan", value: selectedUser.plan?.toUpperCase() },
                { label: "Status", value: selectedUser.status },
                { label: "Files", value: selectedUser.total_files },
                { label: "Storage", value: formatBytes(selectedUser.storage_used) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center shadow-sm">
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {selectedUser.recent_files?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Files</p>
                <div className="space-y-1.5">
                  {selectedUser.recent_files.map((f) => (
                    <div key={f.file_id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
                      <span className="text-xs text-slate-700 font-medium truncate max-w-[60%]">{f.file_name}</span>
                      <span className="text-[11px] text-slate-500">{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedUser.subscription_history?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Subscription History</p>
                <div className="space-y-1.5">
                  {selectedUser.subscription_history.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
                      <div>
                        <span className="text-xs font-semibold text-slate-900 uppercase">{s.plan}</span>
                        <span className="text-[11px] text-slate-500 ml-2">{s.billing_cycle}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-700">₹{s.amount_paid}</span>
                        <span className={`ml-2 text-[10px] font-semibold uppercase ${s.status === "active" ? "text-emerald-600" : "text-slate-500"}`}>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
