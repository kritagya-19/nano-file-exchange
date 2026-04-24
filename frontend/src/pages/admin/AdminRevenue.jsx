import { useState, useEffect } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { adminFetch } from "../../utils/adminApi";

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

const PLAN_COLORS = { Free: "#64748b", Pro: "#3b82f6", Max: "#8b5cf6", free: "#64748b", pro: "#3b82f6", max: "#8b5cf6" };

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

export function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/admin/revenue")
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

  if (!data) return <p className="text-slate-500 text-center py-20">Failed to load revenue data</p>;

  const planPieData = Object.entries(data.users_per_plan || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: PLAN_COLORS[name] || "#64748b",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revenue Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">Subscription revenue analytics and trends</p>
      </div>

      {/* Total Revenue Card */}
      <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-100/50 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm border border-orange-100/50">
            <DollarSign className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.total_revenue)}</p>
            <p className="text-sm font-medium text-orange-600/80">Total Lifetime Revenue</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Monthly Revenue</h3>
          <p className="mt-0.5 text-xs text-slate-500 mb-4">Last 12 months</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_chart || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Users Per Plan</h3>
          <p className="mt-0.5 text-xs text-slate-500 mb-4">Current distribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  {planPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-500 font-medium">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subscriptions per month bar chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Subscription Volume</h3>
        <p className="mt-0.5 text-xs text-slate-500 mb-4">New subscriptions per month</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_chart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="subscriptions" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Subscriptions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900">Recent Subscriptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cycle</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.recent_subscriptions || []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-900 font-medium">{s.user_name}</p>
                    <p className="text-[11px] text-slate-500">{s.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${
                      s.plan === "pro" ? "bg-indigo-50 text-indigo-600" : s.plan === "max" ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-600"
                    }`}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-700 font-medium">{formatCurrency(s.amount)}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{s.billing_cycle}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      s.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {s.purchased_at ? new Date(s.purchased_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {(!data.recent_subscriptions || data.recent_subscriptions.length === 0) && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No subscriptions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
