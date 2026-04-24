import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { adminFetch } from "../../utils/adminApi";

const ACTION_BADGES = {
  admin_login: { label: "Admin Login", cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  login: { label: "User Login", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  upload: { label: "File Upload", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  download: { label: "Download", cls: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  plan_upgrade: { label: "Plan Upgrade", cls: "bg-purple-50 text-purple-700 border-purple-100" },
  user_blocked: { label: "User Blocked", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  user_unblocked: { label: "User Unblocked", cls: "bg-green-50 text-green-700 border-green-100" },
  user_deleted: { label: "User Deleted", cls: "bg-rose-50 text-rose-700 border-rose-100" },
  file_deleted_admin: { label: "File Deleted", cls: "bg-rose-50 text-rose-700 border-rose-100" },
  group_deleted_admin: { label: "Group Deleted", cls: "bg-orange-50 text-orange-700 border-orange-100" },
  error: { label: "Error", cls: "bg-red-50 text-red-700 border-red-100" },
};

function getBadge(action) {
  return ACTION_BADGES[action] || { label: action, cls: "bg-slate-50 text-slate-700 border-slate-200" };
}

export function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 30 });
      if (actionFilter) params.set("action", actionFilter);
      const res = await adminFetch(`/admin/activity-logs?${params}`);
      setLogs(res.logs);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Track all platform activity and administrative actions</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm"
          >
            <option value="">All Actions</option>
            <option value="admin_login">Admin Login</option>
            <option value="login">User Login</option>
            <option value="upload">File Upload</option>
            <option value="download">Download</option>
            <option value="plan_upgrade">Plan Upgrade</option>
            <option value="user_blocked">User Blocked</option>
            <option value="user_unblocked">User Unblocked</option>
            <option value="user_deleted">User Deleted</option>
            <option value="file_deleted_admin">File Deleted (Admin)</option>
            <option value="group_deleted_admin">Group Deleted (Admin)</option>
            <option value="error">Error</option>
          </select>
        </div>
        <span className="text-xs text-slate-600 font-medium">{total} entries</span>
      </div>

      {/* Log entries */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-medium">No activity logs found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const badge = getBadge(log.action);
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition">
                  {/* Timeline dot */}
                  <div className="mt-1.5 flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                       <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {log.user_id && (
                        <span className="text-[11px] font-medium text-slate-500">User #{log.user_id}</span>
                      )}
                    </div>
                    {log.detail && (
                      <p className="mt-1 text-sm font-medium text-slate-700">{log.detail}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                      </span>
                      {log.ip_address && (
                        <span className="text-[11px] font-medium text-slate-500">IP: {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
