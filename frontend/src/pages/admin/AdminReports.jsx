import { useState } from "react";
import {
  FileBarChart,
  Users,
  DollarSign,
  FileText,
  HardDrive,
  Users2,
  ScrollText,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter
} from "lucide-react";
import { getAdminToken, API_BASE_URL } from "../../utils/adminApi";

const REPORT_CATEGORIES = [
  { id: "all", name: "All Reports" },
  { id: "platform", name: "Platform & System" },
  { id: "users", name: "Users & Engagement" },
  { id: "financial", name: "Financial details" },
  { id: "audit", name: "Audit Logs" },
];

const REPORTS = [
  {
    key: "platform-summary",
    category: "platform",
    title: "Platform Summary",
    desc: "Executive overview of total users, files, storage, revenue, and active subscriptions.",
    icon: FileBarChart,
    color: "indigo",
    hasDateFilter: true,
  },
  {
    key: "storage",
    category: "platform",
    title: "Storage Utilization",
    desc: "Per-user breakdown of file storage consumption and percentage of total capacity.",
    icon: HardDrive,
    color: "purple",
    hasDateFilter: false,
  },
  {
    key: "users",
    category: "users",
    title: "User Directory",
    desc: "Export of all registered users, complete with current subscription plans and engagement metrics.",
    icon: Users,
    color: "emerald",
    hasDateFilter: true,
  },
  {
    key: "groups",
    category: "users",
    title: "Group Analytics",
    desc: "Overview of all collaborative groups, creator identities, and member headcounts.",
    icon: Users2,
    color: "pink",
    hasDateFilter: false,
  },
  {
    key: "revenue",
    category: "financial",
    title: "Revenue & Subscriptions",
    desc: "Detailed transactional record of subscription purchases, renewals, amounts paid, and statuses.",
    icon: DollarSign,
    color: "amber",
    hasDateFilter: true,
  },
  {
    key: "files",
    category: "audit",
    title: "File Inventory",
    desc: "Manifest of all files residing on the platform, including owners, sizes, and public share statuses.",
    icon: FileText,
    color: "cyan",
    hasDateFilter: true,
  },
  {
    key: "activity-logs",
    category: "audit",
    title: "System Activity Logs",
    desc: "Raw export of platform events, user actions, and administrative changes for compliance.",
    icon: ScrollText,
    color: "slate",
    hasDateFilter: true,
    hasActionFilter: true,
  },
];

const ACTION_OPTIONS = [
  { value: "", label: "All Events" },
  { value: "admin_login", label: "Admin Authentications" },
  { value: "login", label: "User Authentications" },
  { value: "upload", label: "File Uploads" },
  { value: "download", label: "File Downloads" },
  { value: "plan_upgrade", label: "Plan Upgrades" },
  { value: "user_blocked", label: "User Suspensions" },
  { value: "file_deleted_admin", label: "Admin File Deletions" },
];

const COLOR_MAP = {
  indigo: "bg-indigo-50 text-indigo-600",
  purple: "bg-purple-50 text-purple-600",
  emerald: "bg-emerald-50 text-emerald-600",
  pink: "bg-pink-50 text-pink-600",
  amber: "bg-amber-50 text-amber-600",
  cyan: "bg-cyan-50 text-cyan-600",
  slate: "bg-slate-100 text-slate-600",
};

export function AdminReports() {
  const [filters, setFilters] = useState({});
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  function updateFilter(key, field, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  }

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function downloadReport(reportKey) {
    setDownloading(reportKey);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams();
      const f = filters[reportKey] || {};
      if (f.start) params.set("start", f.start);
      if (f.end) params.set("end", f.end);
      if (f.action) params.set("action", f.action);

      const url = `${API_BASE_URL}/admin/reports/${reportKey}?${params}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : `${reportKey}_report.csv`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);

      showToast("success", `${REPORTS.find((r) => r.key === reportKey)?.title} exported.`);
    } catch (err) {
      showToast("error", err.message || "Failed to generate export");
    } finally {
      setDownloading(null);
    }
  }

  const filteredReports = activeCategory === "all" 
    ? REPORTS 
    : REPORTS.filter((r) => r.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report Generation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate comprehensive CSV exports across all platform datasets
        </p>
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto hide-scrollbar">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Reports List */}
        <div className="divide-y divide-slate-100">
          {filteredReports.map((report) => {
            const Icon = report.icon;
            const f = filters[report.key] || {};
            const isDownloading = downloading === report.key;
            const iconClass = COLOR_MAP[report.color] || COLOR_MAP.slate;

            return (
              <div
                key={report.key}
                className="flex flex-col lg:flex-row lg:items-center gap-6 p-6 transition-colors hover:bg-slate-50/50"
              >
                {/* Info block */}
                <div className="flex flex-1 items-start gap-4 min-w-0">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">{report.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500 leading-relaxed max-w-2xl pe-4">
                      {report.desc}
                    </p>
                  </div>
                </div>

                {/* Controls & Action */}
                <div className="flex flex-wrap items-center gap-4 lg:justify-end shrink-0 pl-15 lg:pl-0">
                  
                  {/* Filter Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {report.hasDateFilter && (
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        <div className="flex items-center px-2 text-slate-400">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <input
                          type="date"
                          value={f.start || ""}
                          onChange={(e) => updateFilter(report.key, "start", e.target.value)}
                          className="w-32 bg-transparent py-1.5 px-2 text-xs font-medium text-slate-700 outline-none focus:text-indigo-600"
                          placeholder="Start"
                        />
                        <span className="text-slate-300 px-1">—</span>
                        <input
                          type="date"
                          value={f.end || ""}
                          onChange={(e) => updateFilter(report.key, "end", e.target.value)}
                          className="w-32 bg-transparent py-1.5 px-2 text-xs font-medium text-slate-700 outline-none focus:text-indigo-600"
                          placeholder="End"
                        />
                      </div>
                    )}
                    
                    {report.hasActionFilter && (
                      <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                          <Filter className="h-3.5 w-3.5" />
                        </div>
                        <select
                          value={f.action || ""}
                          onChange={(e) => updateFilter(report.key, "action", e.target.value)}
                          className="w-48 appearance-none bg-transparent py-2.5 pl-8 pr-8 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:text-indigo-600"
                        >
                          {ACTION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => downloadReport(report.key)}
                    disabled={isDownloading}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                        <span>Generating</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 text-white/80" />
                        <span>Download CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer info acting as visual closure */}
        {filteredReports.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-500">
            No reports found for this category.
          </div>
        )}
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl transition-all animate-in slide-in-from-bottom-6 duration-300 ${
            toast.type === "success"
              ? "bg-white border-emerald-100 text-slate-800"
              : "bg-white border-rose-100 text-slate-800"
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toast.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">{toast.type === "success" ? "Export Complete" : "Export Failed"}</p>
            <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
