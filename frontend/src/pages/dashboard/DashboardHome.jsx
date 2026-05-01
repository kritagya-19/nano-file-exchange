import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CloudUpload,
  Crown,
  FileText,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Code2,
  File as FileIcon,
  Share2,
  Star,
  Users,
  Zap,
  RefreshCw,
  Sparkles,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nameFromEmail } from "../../utils/displayName";
import { apiFetch, API_BASE_URL } from "../../utils/api";

const FILE_TYPE_META = {
  images:    { icon: ImageIcon, color: "from-indigo-500 to-indigo-400", bg: "bg-indigo-50",  text: "text-indigo-600" },
  documents: { icon: FileText,  color: "from-brand to-brand-light",     bg: "bg-brand/10",   text: "text-brand" },
  videos:    { icon: Video,     color: "from-slate-700 to-slate-600",   bg: "bg-slate-100",  text: "text-slate-700" },
  audio:     { icon: Music,     color: "from-sky-500 to-sky-400",       bg: "bg-sky-50",     text: "text-sky-600" },
  archives:  { icon: Archive,   color: "from-slate-500 to-slate-400",   bg: "bg-slate-100",  text: "text-slate-600" },
  code:      { icon: Code2,     color: "from-blue-600 to-blue-500",     bg: "bg-blue-50",    text: "text-blue-600" },
  other:     { icon: FileIcon,  color: "from-slate-400 to-slate-300",   bg: "bg-slate-50",   text: "text-slate-500" },
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name?.trim() || nameFromEmail(user?.email || "");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showLoader = true) => {
    if (!user?.token) return;
    if (showLoader) setLoading(true);
    try {
      const data = await apiFetch("/dashboard/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchStats();
    // Poll every 60s — dashboard stats are aggregates that change slowly
    const interval = setInterval(() => fetchStats(false), 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(false);
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm text-muted font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const storageUsed = stats?.storage_used || 0;
  const storageLimit = stats?.storage_limit || 21474836480;
  const storagePct = stats?.storage_pct || 0;
  const totalFiles = stats?.total_files || 0;
  const activeGroups = stats?.active_groups || 0;
  const sharedFiles = stats?.shared_files || 0;
  const starredFiles = stats?.starred_files || 0;
  const totalFolders = stats?.total_folders || 0;
  const recentFiles = stats?.recent_files || [];
  const typeBreakdown = stats?.type_breakdown || {};

  const storageColor = storagePct > 90 ? "from-rose-500 to-rose-400" : storagePct > 70 ? "from-brand-dark to-brand" : "from-brand to-brand-light";

  return (
    <div className="space-y-8 pb-8 md:pb-12">
      {/* ─── Hero Header ─── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {greet},{" "}
            <span className="bg-gradient-to-r from-brand-dark to-brand bg-clip-text text-transparent">
              {displayName.split(" ")[0] || displayName}
            </span>
            ! <span className="inline-block animate-bounce" aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted sm:text-base">
            Here&apos;s what&apos;s happening with your files today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/dashboard/files")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5"
          >
            <CloudUpload className="h-4 w-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* ─── Current Plan Badge ─── */}
      {stats?.current_plan && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
              stats.current_plan === "max"
                ? "bg-slate-900"
                : stats.current_plan === "pro"
                ? "bg-gradient-to-br from-brand-dark to-brand"
                : "bg-slate-500"
            }`}>
              {stats.current_plan === "max" ? (
                <Crown className="h-5 w-5" />
              ) : stats.current_plan === "pro" ? (
                <Zap className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-ink capitalize">{stats.current_plan} Plan</p>
              <p className="text-xs text-muted mt-0.5">
                {stats.current_plan === "free"
                  ? "Upgrade to unlock more storage & features"
                  : "You're on a premium plan"}
              </p>
            </div>
          </div>
          {stats.current_plan !== "max" && (
            <button
              onClick={() => navigate("/dashboard/pricing")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 hover:shadow-lg transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              {stats.current_plan === "free" ? "Upgrade Now" : "Upgrade to Max"}
            </button>
          )}
        </div>
      )}

      {/* ─── Stats Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Files"
          value={totalFiles}
          hint={`${totalFolders} folder${totalFolders !== 1 ? "s" : ""}`}
          icon={FolderOpen}
          gradient="from-brand to-brand-light"
          to="/dashboard/files"
        />
        <StatCard
          title="Active Groups"
          value={activeGroups}
          hint="Collaborations"
          icon={Users}
          gradient="from-indigo-500 to-indigo-400"
          to="/dashboard/groups"
        />
        <StatCard
          title="Shared Files"
          value={sharedFiles}
          hint="Public links"
          icon={Share2}
          gradient="from-sky-500 to-sky-400"
          to="/dashboard/shared"
        />
        <StatCard
          title="Starred"
          value={starredFiles}
          hint="Favourites"
          icon={Star}
          gradient="from-slate-700 to-slate-600"
          to="/dashboard/starred"
        />
      </div>

      {/* ─── Storage Card (Premium) ─── */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gradient-to-br from-brand/10 to-brand-light/5 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${storageColor} text-white shadow-lg`}>
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted">Storage Used</h3>
              <p className="text-2xl font-extrabold text-ink tracking-tight">
                {formatBytes(storageUsed)}
                <span className="text-sm font-medium text-muted ml-2">/ {formatBytes(storageLimit)}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black tracking-tight bg-gradient-to-r ${storageColor} bg-clip-text text-transparent`}>
              {storagePct}%
            </p>
            <p className="text-xs text-muted mt-0.5">capacity</p>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 relative z-10">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${storageColor} transition-all duration-1000 ease-out relative`}
            style={{ width: `${Math.max(storagePct, 1)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* ── Recent Files ── */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-ink">Recent Files</h2>
            </div>
            <Link to="/dashboard/files" className="text-sm font-semibold text-brand hover:text-brand/80 flex items-center gap-1 transition-colors">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {recentFiles.length === 0 ? (
            <div className="px-6 pb-8 pt-4">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
                  <FileText className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <p className="mt-5 font-semibold text-ink">No files yet</p>
                <p className="mt-1.5 max-w-xs text-sm text-muted">Upload your first file to see it here.</p>
                <button 
                  onClick={() => navigate("/dashboard/files")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand/90 transition"
                >
                  <CloudUpload className="h-4 w-4" /> Upload Now
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentFiles.map((f) => {
                const meta = FILE_TYPE_META[f.file_type] || FILE_TYPE_META[_categorize(f.file_type)] || FILE_TYPE_META.other;
                const Icon = meta.icon;
                return (
                  <div key={f.file_id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.text}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.75}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{f.file_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">{formatBytes(f.size)}</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-muted">{timeAgo(f.uploaded_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.is_favorite && <Star className="w-4 h-4 text-amber-400" fill="currentColor" />}
                      {f.share_token && <Share2 className="w-4 h-4 text-sky-500" />}
                      <a 
                        href={`${API_BASE_URL}/files/${f.file_id}`}
                        download
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" /> Quick Actions
            </h2>
            <div className="space-y-2.5">
              <QuickAction
                title="Upload Files"
                desc="Drag & drop or browse"
                icon={CloudUpload}
                gradient="from-brand-dark to-brand"
                to="/dashboard/files"
              />
              <QuickAction
                title="Create Group"
                desc="Start collaborating"
                icon={Users}
                gradient="from-slate-700 to-slate-800"
                to="/dashboard/groups"
              />
              <QuickAction
                title="Share Files"
                desc="Create public links"
                icon={Share2}
                gradient="from-indigo-500 to-indigo-600"
                to="/dashboard/shared"
              />
            </div>
          </div>

          {/* File Types Breakdown */}
          {Object.keys(typeBreakdown).length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" /> Storage Breakdown
              </h2>
              <div className="space-y-3">
                {Object.entries(typeBreakdown)
                  .sort(([,a], [,b]) => b.size - a.size)
                  .map(([category, data]) => {
                    const meta = FILE_TYPE_META[category] || FILE_TYPE_META.other;
                    const Icon = meta.icon;
                    const pctOfTotal = storageUsed > 0 ? Math.round((data.size / storageUsed) * 100) : 0;
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.text}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-ink capitalize">{category}</span>
                            <span className="text-[10px] font-medium text-muted">{data.count} file{data.count !== 1 ? "s" : ""} · {formatBytes(data.size)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${meta.color || "from-slate-400 to-slate-500"} transition-all duration-700`}
                              style={{ width: `${Math.max(pctOfTotal, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ title, value, hint, icon: Icon, gradient, to }) {
  return (
    <Link
      to={to}
      className="group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 overflow-hidden"
    >
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] blur-xl group-hover:opacity-[0.12] transition-opacity`}></div>
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-slate-300" />
      </div>
    </Link>
  );
}

function QuickAction({ title, desc, icon: Icon, gradient, to }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:border-slate-200 hover:shadow-sm"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
    </Link>
  );
}

/* Utility to categorize file extensions for type icon mapping */
function _categorize(ext) {
  const images = new Set(["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "tiff"]);
  const documents = new Set(["pdf", "doc", "docx", "txt", "xls", "xlsx", "ppt", "pptx", "csv", "rtf", "odt"]);
  const videos = new Set(["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"]);
  const audio = new Set(["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"]);
  const archives = new Set(["zip", "rar", "7z", "tar", "gz", "bz2"]);
  const code = new Set(["py", "js", "jsx", "ts", "tsx", "html", "css", "json", "xml", "yaml", "yml", "md", "sql", "java", "c", "cpp", "go", "rs"]);
  
  if (images.has(ext)) return "images";
  if (documents.has(ext)) return "documents";
  if (videos.has(ext)) return "videos";
  if (audio.has(ext)) return "audio";
  if (archives.has(ext)) return "archives";
  if (code.has(ext)) return "code";
  return "other";
}
