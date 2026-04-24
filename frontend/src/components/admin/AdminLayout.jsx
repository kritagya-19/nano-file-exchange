import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Shield,
  Users,
  Wallet,
  HardDrive,
  Users2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAdminData, clearAdmin } from "../../utils/adminApi";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users, end: false },
  { to: "/admin/files", label: "Files", icon: FileText, end: false },
  { to: "/admin/groups", label: "Groups", icon: Users2, end: false },
  { to: "/admin/plans", label: "Plans", icon: Settings, end: false },
  { to: "/admin/storage", label: "Storage", icon: HardDrive, end: false },
  { to: "/admin/revenue", label: "Revenue", icon: Wallet, end: false },
  { to: "/admin/activity", label: "Activity Logs", icon: ScrollText, end: false },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart, end: false },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-indigo-50 text-indigo-700 shadow-sm"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
  }`;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const admin = getAdminData();

  useEffect(() => {
    if (!admin?.token) {
      navigate("/admin/login", { replace: true });
    }
  }, [admin, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#admin-profile-menu")) setProfileOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function handleLogout() {
    clearAdmin();
    navigate("/admin/login", { replace: true });
  }

  if (!admin?.token) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 w-[17.5rem]" : `-translate-x-full lg:translate-x-0 ${isMinimized ? "lg:w-20" : "lg:w-[17.5rem]"}`
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-200 py-5 transition-all ${isMinimized ? "justify-center px-3" : "justify-between px-4"}`}>
          <NavLink to="/admin" className="flex items-center gap-2.5 font-semibold text-slate-900 hover:opacity-80 transition" onClick={() => setSidebarOpen(false)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Shield className="h-5 w-5" strokeWidth={2.5} />
            </span>
            {!isMinimized && <span className="text-lg tracking-tight">Admin Console</span>}
          </NavLink>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
          <button
            className="hidden lg:flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {!isMinimized && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Navigation</p>}
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClass} onClick={() => setSidebarOpen(false)} title={isMinimized ? label : undefined}>
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} strokeWidth={1.75} />
                      {!isMinimized && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile */}
        <div className="border-t border-slate-200 p-3 bg-white">
          <div id="admin-profile-menu" className="relative flex justify-center">
            {profileOpen && (
              <div className={`absolute mb-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 ${isMinimized ? "left-full bottom-0 ml-2 w-52" : "bottom-full left-0 w-full"}`}>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-3 w-full rounded-xl p-2 transition ${profileOpen ? "bg-slate-50" : "hover:bg-slate-50"} ${isMinimized ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm">
                  {String(admin?.admin_id || "A").charAt(0).toUpperCase()}
                </div>
                {!isMinimized && (
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-bold text-slate-900 leading-tight">Administrator</p>
                    <p className="truncate text-[11px] text-slate-500 font-medium">#{admin?.admin_id}</p>
                  </div>
                )}
              </div>
              {!isMinimized && (
                <div className="text-slate-400 shrink-0">
                  {profileOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden shadow-sm">
          <button
            className="inline-flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Admin Console</span>
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
