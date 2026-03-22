import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CloudUpload,
  FileText,
  FolderInput,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Search,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nameFromEmail } from "../../utils/displayName";

const FILTER_TYPES = [
  { id: "all", label: "All" },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "videos", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "archives", label: "Archives" },
];

const activityItems = [
  { text: "No recent shares yet — invite someone from Shared or a group.", time: "—" },
  { text: "Upload a file to see transfer and version activity here.", time: "—" },
];

export function DashboardHome() {
  const { user } = useAuth();
  const displayName = user?.name?.trim() || nameFromEmail(user?.email || "");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 pb-8 md:pb-28">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {greet}, {displayName.split(" ")[0] || displayName}!{" "}
            <span className="inline-block" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted sm:text-base">Here&apos;s what&apos;s happening with your files today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FolderInput className="h-4 w-4 text-slate-600" strokeWidth={2} />
            New Folder
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark"
          >
            <CloudUpload className="h-4 w-4" strokeWidth={2} />
            Upload Files
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files, folders, and shared links…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-blue-100"
          aria-label="Search files"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
              filter === id
                ? "border-brand bg-blue-50 text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Files"
          value="0"
          hint="Across all folders"
          badge="+12%"
          badgeTone="emerald"
          icon={FolderOpen}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Active Groups"
          value="0"
          hint="Collaborations"
          icon={Users}
          iconBg="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Storage Used"
          value="0%"
          hint="0 MB of 5.0 GB"
          icon={HardDrive}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Shared Files"
          value="0"
          hint="Public links active"
          icon={Share2}
          iconBg="bg-sky-50 text-sky-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-ink">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="Upload Files"
              desc="Drag & drop or pick from your device — resumable uploads."
              icon={CloudUpload}
              iconClass="bg-brand text-white"
              to="/dashboard/files"
            />
            <QuickAction
              title="Create Group"
              desc="Invite teammates and keep chats next to shared folders."
              icon={Users}
              iconClass="bg-violet-500 text-white"
              to="/dashboard/groups"
            />
            <QuickAction
              title="Share Files"
              desc="Create links with optional expiry and download limits."
              icon={Share2}
              iconClass="bg-emerald-500 text-white"
              to="/dashboard/shared"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-ink">Recent Files</h2>
            <Link to="/dashboard/files" className="text-sm font-semibold text-brand hover:text-brand-dark">
              View All
            </Link>
          </div>
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
              <FileText className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-medium text-ink">No files yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted">Upload your first file to get started.</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Activity Overview</h2>
            <p className="text-sm text-muted">Your file activity this week — shares, uploads, and group updates.</p>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted sm:mt-0">
            <BarChart3 className="h-3.5 w-3.5" />
            Live when backend is connected
          </div>
        </div>
        <ul className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          {activityItems.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-4 text-sm">
              <span className="text-slate-700">{item.text}</span>
              <span className="shrink-0 text-xs text-muted">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>

      <div
        className="fixed bottom-6 right-6 z-20 hidden max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/80 md:flex"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <TrendingUp className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Transfers</p>
          <p className="text-xs text-muted">No active uploads or downloads.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, badge, badgeTone, icon: Icon, iconBg }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
          {badge && (
            <span
              className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                badgeTone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, icon: Icon, iconClass, to }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
    </Link>
  );
}
