import { useState, useEffect } from "react";
import { Users, FileText, HardDrive, DollarSign, TrendingUp, Users2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { adminFetch } from "../../utils/adminApi";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const PLAN_COLORS = { free: "#64748b", pro: "#3b82f6", max: "#8b5cf6" };
const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

function StatCard({ icon: Icon, label, value, subtext, color = "brand", trend }) {
  const iconBgMap = {
    brand: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgMap[color]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500 font-medium">{label}</p>
      {subtext && <p className="mt-0.5 text-[11px] text-slate-500">{subtext}</p>}
    </div>
  );
}

const customTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "10px 14px",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 500,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/admin/dashboard")
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

  if (!data) {
    return <p className="text-center text-slate-500 py-20">Failed to load dashboard data.</p>;
  }

  const planPieData = Object.entries(data.plan_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: PLAN_COLORS[name] || "#64748b",
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform overview and real-time analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={data.total_users.toLocaleString()} subtext={`${data.active_users} active`} color="brand" />
        <StatCard icon={FileText} label="Total Files" value={data.total_files.toLocaleString()} color="green" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(data.total_storage)} color="purple" />
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(data.total_revenue)} subtext={`${formatCurrency(data.monthly_revenue)} this month`} color="orange" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900">Revenue Trend</h3>
          <p className="mt-0.5 text-xs text-slate-500">Last 6 months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_revenue_chart}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`₹${v}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900">User Growth</h3>
          <p className="mt-0.5 text-xs text-slate-500">New signups per month</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.user_growth_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="users" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900">Plan Distribution</h3>
          <p className="mt-0.5 text-xs text-slate-500">Users per plan</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                  {planPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-xs text-slate-500">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* File Uploads */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900">File Uploads</h3>
          <p className="mt-0.5 text-xs text-slate-500">Monthly upload activity</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.upload_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Line type="monotone" dataKey="uploads" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Storage Users */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900">Top Storage Users</h3>
          <p className="mt-0.5 text-xs text-slate-500">By storage consumed</p>
          <div className="mt-4 space-y-3">
            {(data.top_storage_users || []).map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-600" : "bg-slate-300 text-slate-700"
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{u.email}</p>
                </div>
                <span className="text-xs font-semibold text-slate-600">{formatBytes(u.storage_used)}</span>
              </div>
            ))}
            {(!data.top_storage_users || data.top_storage_users.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-8">No users yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-slate-900">{data.total_groups}</p>
          <p className="text-xs text-slate-500 mt-1">Total Groups</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-slate-900">{data.new_users_month}</p>
          <p className="text-xs text-slate-500 mt-1">New Users (Month)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-emerald-600">{data.active_users}</p>
          <p className="text-xs text-slate-500 mt-1">Active Users</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-amber-600">{formatCurrency(data.monthly_revenue)}</p>
          <p className="text-xs text-slate-500 mt-1">Monthly Revenue</p>
        </div>
      </div>
    </div>
  );
}
