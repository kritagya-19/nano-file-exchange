import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  Cloud,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Settings,
  Share2,
  Star,
  Trash2,
  Users,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nameFromEmail } from "../../utils/displayName";
import { apiFetch } from "../../utils/api";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/files", label: "My Files", icon: FolderOpen, end: false },
  { to: "/dashboard/groups", label: "Groups", icon: Users, end: false },
  { to: "/dashboard/shared", label: "Shared", icon: Share2, end: false },
  { to: "/dashboard/starred", label: "Starred", icon: Star, end: false },
  { to: "/dashboard/trash", label: "Trash", icon: Trash2, end: false },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive ? "bg-brand/10 text-brand" : "text-slate-400 hover:bg-slate-800 hover:text-white"
  }`;

function SidebarLink({ to, label, icon: Icon, end, onNavigate, isMinimized }) {
  return (
    <NavLink to={to} end={end} className={linkClass} onClick={onNavigate} title={isMinimized ? label : undefined}>
      {({ isActive }) => (
        <>
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-brand" : "text-slate-400 opacity-80"}`} strokeWidth={1.75} />
          {!isMinimized && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(21474836480);
  const [storagePct, setStoragePct] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("free");

  const displayName = user?.name?.trim() || nameFromEmail(user?.email || "");

  const fetchStorage = useCallback(async () => {
    if (!user?.token) return;
    try {
      const data = await apiFetch("/dashboard/stats");
      setStorageUsed(data.storage_used || 0);
      setStorageLimit(data.storage_limit || 21474836480);
      setStoragePct(data.storage_pct || 0);
      if (data.current_plan) setCurrentPlan(data.current_plan);
    } catch {
      // silent
    }
  }, [user?.token]);

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 30000);
    return () => clearInterval(interval);
  }, [fetchStorage]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Close profile menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-ink">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 w-[17.5rem]" : `-translate-x-full lg:translate-x-0 ${isMinimized ? "lg:w-20" : "lg:w-[17.5rem]"}`
        }`}
      >
        <div className={`flex items-center border-b border-slate-800 py-5 transition-all duration-300 ${isMinimized ? "justify-center px-0" : "justify-between px-4"}`}>
          <NavLink
            to="/dashboard"
            className="flex items-center justify-center gap-2.5 font-semibold text-white transition-opacity hover:opacity-80"
            onClick={() => setSidebarOpen(false)}
            title={isMinimized ? "NanoFile" : undefined}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-dark to-brand text-white shadow-lg shadow-brand/25">
              <Cloud className="h-5 w-5" strokeWidth={2.5} />
            </span>
            {!isMinimized && <span className="text-lg tracking-tight truncate">NanoFile</span>}
          </NavLink>
          {/* Mobile close */}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Desktop minimize toggle */}
          <button
            type="button"
            className="hidden lg:flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand Menu" : "Minimize Menu"}
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isMinimized ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" aria-label="Main">
          {!isMinimized && <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Menu</p>}
          <ul className="space-y-1 relative">
            {mainNav.map(({ to, label, icon, end }) => (
              <li key={to}>
                <SidebarLink to={to} label={label} icon={icon} end={end} onNavigate={() => setSidebarOpen(false)} isMinimized={isMinimized} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-3">
          {/* Profile Drop-up Menu Container */}
          <div id="profile-menu-container" className="relative flex justify-center">
            {/* Pop-up Menu */}
            {profileMenuOpen && (
              <div className={`absolute mb-2 rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl shadow-slate-900/50 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 ${isMinimized ? "left-full bottom-0 ml-2 w-52" : "bottom-full left-0 w-full"}`}>
                <div className="px-2 py-1.5 mb-1 border-b border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account</p>
                </div>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboard/pricing");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Zap className="h-4 w-4 text-brand-light" />
                  Upgrade Plan
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboard/help");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <LifeBuoy className="h-4 w-4" />
                  Help & Support
                </button>
                <div className="my-1 border-t border-slate-700" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}

            {/* Profile Button */}
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={isMinimized ? "Account Options" : undefined}
              className={`flex items-center gap-3 w-full rounded-xl p-2 transition-all duration-200 ${
                profileMenuOpen ? "bg-slate-800 shadow-inner" : "hover:bg-slate-800"
              } ${isMinimized ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand text-sm font-bold text-white shadow-md shadow-brand/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                {!isMinimized && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-bold text-white leading-tight">{displayName}</p>
                    <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
                  </div>
                )}
              </div>
              {!isMinimized && (
                <div className="text-slate-400 shrink-0">
                  {profileMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-ink">NanoFile</span>
        </div>

        <main className="relative flex-1">
          <div className={`${location.pathname.startsWith('/dashboard/groups') ? 'h-[calc(100vh-60px)] lg:h-screen w-full' : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
