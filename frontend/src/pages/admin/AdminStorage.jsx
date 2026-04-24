import { useState, useEffect } from "react";
import { HardDrive, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminFetch } from "../../utils/adminApi";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "10px 14px",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 500,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export function AdminStorage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/admin/storage")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-500 text-center py-20">Failed to load storage data</p>;

  const chartData = (data.per_user || []).slice(0, 10).map((u) => ({
    name: u.name?.split(" ")[0] || u.email?.split("@")[0] || "User",
    storage: u.storage_used,
    storageLabel: formatBytes(u.storage_used),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Storage Management</h1>
        <p className="mt-1 text-sm text-slate-500">System-wide storage analytics and per-user usage</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100/30 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm border border-purple-100 text-purple-600">
              <HardDrive className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(data.total_storage)}</p>
              <p className="text-xs font-medium text-slate-600">Total Storage Used</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm border border-indigo-100 text-indigo-600">
              <Database className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.total_files?.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-600">Total Files</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Top Users by Storage</h3>
          <p className="mt-0.5 text-xs text-slate-500 mb-4">Top 10 users consuming the most storage</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBytes(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatBytes(v), "Storage"]} />
                <Bar dataKey="storage" fill="#a855f7" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-user table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900">Storage Per User</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Used</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.per_user || []).map((u, i) => {
                const pct = data.total_storage > 0 ? (u.storage_used / data.total_storage) * 100 : 0;
                return (
                  <tr key={u.user_id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-xs text-slate-500 font-medium">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700 font-medium">{formatBytes(u.storage_used)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
