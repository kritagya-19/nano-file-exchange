import { useState, useEffect, useCallback, useMemo } from "react";
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
  Activity
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nameFromEmail } from "../../utils/displayName";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const FILE_TYPE_META = {
  images:    { icon: ImageIcon, color: "from-indigo-500 to-indigo-400", hex: "#6366f1", bg: "bg-indigo-50",  text: "text-indigo-600" },
  documents: { icon: FileText,  color: "from-emerald-500 to-emerald-400", hex: "#10b981", bg: "bg-emerald-50",   text: "text-emerald-600" },
  videos:    { icon: Video,     color: "from-rose-500 to-rose-400",   hex: "#f43f5e", bg: "bg-rose-50",  text: "text-rose-600" },
  audio:     { icon: Music,     color: "from-amber-500 to-amber-400", hex: "#f59e0b", bg: "bg-amber-50",     text: "text-amber-600" },
  archives:  { icon: Archive,   color: "from-slate-500 to-slate-400", hex: "#64748b", bg: "bg-slate-100",  text: "text-slate-600" },
  code:      { icon: Code2,     color: "from-blue-600 to-blue-500",   hex: "#2563eb", bg: "bg-blue-50",    text: "text-blue-600" },
  other:     { icon: FileIcon,  color: "from-slate-400 to-slate-300", hex: "#94a3b8", bg: "bg-slate-50",   text: "text-slate-500" },
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
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dashboard_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showLoader = true) => {
    if (!user?.token) return;
    if (showLoader && !stats) setLoading(true);
    try {
      const data = await apiFetch("/dashboard/stats");
      setStats(data);
      sessionStorage.setItem('dashboard_stats', JSON.stringify(data));
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, stats]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(false), 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(false);
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const typeBreakdown = stats?.type_breakdown || {};
  
  const chartData = useMemo(() => {
    return Object.entries(typeBreakdown)
      .filter(([, data]) => data.size > 0)
      .map(([category, data]) => ({
        name: category,
        value: data.size,
        count: data.count,
        color: FILE_TYPE_META[category]?.hex || FILE_TYPE_META.other.hex
      }))
      .sort((a, b) => b.value - a.value);
  }, [typeBreakdown]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full border-t-2 border-brand animate-spin"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-xl shadow-brand/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Preparing Workspace</p>
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

  return (
    <div className="space-y-6 pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        
        <div className="relative p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-500 mb-5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> 
              System Online & Secure
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {greet},{" "}
              <span className="bg-gradient-to-r from-brand to-indigo-500 bg-clip-text text-transparent">
                {displayName.split(" ")[0] || displayName}
              </span>
            </h1>
            <p className="mt-3 text-base text-slate-500 max-w-xl leading-relaxed">
              Your intelligent workspace is ready. You have <strong className="text-slate-700">{totalFiles} files</strong> taking up <strong className="text-slate-700">{formatBytes(storageUsed)}</strong> of space.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand" : "text-slate-400"}`} />
              Sync
            </button>
            <button
              onClick={() => navigate("/dashboard/files")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-900/20 hover:-translate-y-0.5"
            >
              <CloudUpload className="h-4 w-4 text-slate-300" />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Files"
          value={totalFiles}
          hint={`${totalFolders} folder${totalFolders !== 1 ? "s" : ""}`}
          icon={FolderOpen}
          gradient="from-brand to-indigo-500"
          to="/dashboard/files"
        />
        <StatCard
          title="Active Groups"
          value={activeGroups}
          hint="Collaborations"
          icon={Users}
          gradient="from-emerald-500 to-teal-400"
          to="/dashboard/groups"
        />
        <StatCard
          title="Starred"
          value={starredFiles}
          hint="Quick access"
          icon={Star}
          gradient="from-rose-500 to-pink-500"
          to="/dashboard/starred"
        />
      </div>

      {/* ─── Bento Grid Section ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* ── Storage Card ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm relative overflow-hidden group flex-1">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
              <HardDrive className="w-32 h-32 text-slate-900 rotate-12" />
            </div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Storage Usage</h3>
                  <p className="text-xs text-slate-500">Plan limit: {formatBytes(storageLimit)}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center py-6">
                <div className="relative w-40 h-40 drop-shadow-md">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      strokeDasharray={`${2 * Math.PI * 40}`} 
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.max(storagePct, 2) / 100)}`}
                      className={`transition-all duration-1000 ease-out ${storagePct > 90 ? 'text-rose-500' : storagePct > 70 ? 'text-amber-500' : 'text-brand'}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{storagePct}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Total Used</p>
                    <p className="text-xl font-bold text-slate-900">{formatBytes(storageUsed)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Available</p>
                    <p className="text-xl font-bold text-slate-400">{formatBytes(storageLimit - storageUsed)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Plan Mini-card */}
          {stats?.current_plan && (
            <div className="rounded-[2rem] border border-slate-100 bg-slate-900 p-6 shadow-xl shadow-slate-900/10 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner">
                    {stats.current_plan === "max" ? <Crown className="w-5 h-5 text-amber-400" /> : <Zap className="w-5 h-5 text-brand-light" />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Current Plan</p>
                    <p className="font-bold text-lg capitalize flex items-center gap-2">
                      {stats.current_plan}
                      {stats.current_plan === "max" && <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] uppercase">Ultimate</span>}
                    </p>
                  </div>
                </div>
                {stats.current_plan !== "max" && (
                  <button onClick={() => navigate("/dashboard/pricing")} className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-bold shadow-sm hover:bg-slate-50 transition">
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Type Breakdown & Analytics ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand" /> Content Analytics
              </h3>
            </div>
            
            {chartData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-8 flex-1 min-h-[280px]">
                <div className="w-full md:w-1/2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={6}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm hover:opacity-80 transition-opacity outline-none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatBytes(value)}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-3 overflow-y-auto pr-2 max-h-64 scrollbar-thin">
                  {chartData.map((data) => {
                    const meta = FILE_TYPE_META[data.name] || FILE_TYPE_META.other;
                    const Icon = meta.icon;
                    return (
                      <div key={data.name} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${meta.bg} ${meta.text}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-900 text-sm capitalize truncate">{data.name}</span>
                            <span className="font-bold text-slate-700 text-sm">{formatBytes(data.value)}</span>
                          </div>
                          <p className="text-xs text-slate-500">{data.count} file{data.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold mb-1">No Data Available</p>
                <p className="text-slate-500 text-sm">Upload files to see analytics here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Recent Files & Quick Actions ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* ── Recent Files ── */}
        <div className="lg:col-span-2 rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
            </h2>
            <Link to="/dashboard/files" className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex-1">
            {recentFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold mb-1">No Recent Files</h3>
                <p className="text-slate-500 text-sm max-w-xs mb-6">Upload some files to see them appear here in your recent activity.</p>
                <button 
                  onClick={() => navigate("/dashboard/files")}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand-dark transition"
                >
                  <CloudUpload className="h-4 w-4" /> Upload Now
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {recentFiles.slice(0, 5).map((f) => {
                  const meta = FILE_TYPE_META[f.file_type] || FILE_TYPE_META[_categorize(f.file_type)] || FILE_TYPE_META.other;
                  const Icon = meta.icon;
                  return (
                    <li key={f.file_id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center shadow-sm ${meta.bg} ${meta.text}`}>
                          <Icon className="w-6 h-6" strokeWidth={1.5}/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate pr-4">{f.file_name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                            <span>{formatBytes(f.size)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{timeAgo(f.uploaded_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pl-4 shrink-0">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:mr-2">
                          {f.is_favorite && <Star className="w-5 h-5 text-amber-400" fill="currentColor" />}
                          {f.share_token && <Share2 className="w-5 h-5 text-brand" />}
                        </div>
                        <a 
                          href={`${API_BASE_URL}/files/${f.file_id}`}
                          download
                          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 transition-all shadow-sm"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="lg:col-span-1 rounded-[2rem] border border-slate-100 bg-white shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Fast Forward
          </h2>
          <div className="space-y-4">
            <QuickAction
              title="Secure Upload"
              desc="End-to-end encrypted transfer"
              icon={CloudUpload}
              bg="bg-brand/10"
              color="text-brand"
              border="border-brand/20"
              to="/dashboard/files"
            />
            <QuickAction
              title="Team Workspace"
              desc="Collaborate with your group"
              icon={Users}
              bg="bg-indigo-50"
              color="text-indigo-600"
              border="border-indigo-100"
              to="/dashboard/groups"
            />
            <QuickAction
              title="Code Snippets"
              desc="Your saved scripts"
              icon={Code2}
              bg="bg-slate-100"
              color="text-slate-700"
              border="border-slate-200"
              to="/dashboard/files"
            />
          </div>
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
      className="group relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:border-slate-200 overflow-hidden block"
    >
      <div className="flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shadow-current/20`}>
            <Icon className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 group-hover:-translate-y-1">
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</p>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">{hint}</p>
        </div>
      </div>
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-tl ${gradient} opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500`}></div>
    </Link>
  );
}

function QuickAction({ title, desc, icon: Icon, bg, color, border, to }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-2xl border ${border} bg-white p-4 transition-all hover:shadow-md hover:border-slate-300`}
    >
      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${bg} ${color}`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 font-medium">{desc}</p>
      </div>
      <div className="w-8 h-8 shrink-0 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </Link>
  );
}

function _categorize(ext) {
  if (!ext) return "other";
  ext = ext.toLowerCase().replace('.', '');
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
