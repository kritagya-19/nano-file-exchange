import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nameFromEmail } from "../../utils/displayName";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/files", label: "My Files", icon: FolderOpen, end: false },
  { to: "/dashboard/groups", label: "Groups", icon: Users, end: false },
  { to: "/dashboard/shared", label: "Shared", icon: Share2, end: false },
  { to: "/dashboard/starred", label: "Starred", icon: Star, end: false },
];

const supportNav = [
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/help", label: "Help & Support", icon: LifeBuoy },
  { to: "/dashboard/trash", label: "Trash", icon: Trash2 },
];

const STORAGE_USED_MB = 0;
const STORAGE_TOTAL_GB = 5;
const storagePct = Math.min(100, (STORAGE_USED_MB / (STORAGE_TOTAL_GB * 1024)) * 100);

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? "bg-blue-50 text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
  }`;

function SidebarLink({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink to={to} end={end} className={linkClass} onClick={onNavigate}>
      {({ isActive }) => (
        <>
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-brand" : "text-slate-500"}`} strokeWidth={1.75} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.name?.trim() || nameFromEmail(user?.email || "");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-ink">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-slate-100 bg-white shadow-sm transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-5">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-ink"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/25">
              <Cloud className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-lg tracking-tight">NanoFile</span>
          </NavLink>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
          <ul className="space-y-0.5">
            {mainNav.map(({ to, label, icon, end }) => (
              <li key={to}>
                <SidebarLink to={to} label={label} icon={icon} end={end} onNavigate={() => setSidebarOpen(false)} />
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Support</p>
          <ul className="space-y-0.5">
            {supportNav.map(({ to, label, icon }) => (
              <li key={to}>
                <SidebarLink to={to} label={label} icon={icon} onNavigate={() => setSidebarOpen(false)} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-xs font-semibold text-slate-700">Storage</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {STORAGE_USED_MB} MB of {STORAGE_TOTAL_GB}.0 GB used
            </p>
          </div>

          <NavLink
            to="/dashboard/profile"
            className="mt-4 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink"
          >
            Sign Out
            <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={2} />
          </button>
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
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
