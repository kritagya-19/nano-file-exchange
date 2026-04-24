import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, Hash, ArrowLeft } from "lucide-react";
import { adminFetch, setAdminData, getAdminToken } from "../../utils/adminApi";

export function AdminLogin() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getAdminToken()) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!adminId || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await adminFetch("/admin/login", {
        method: "POST",
        body: { admin_id: parseInt(adminId), password },
      });
      setAdminData({ token: res.token, admin_id: res.admin_id, role: res.role });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-brand/20 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 bottom-1/4 h-60 w-60 rounded-full bg-indigo-600/20 blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/30">
              <Shield className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">NanoFile</p>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Admin Console</p>
            </div>
          </div>

          <h1 className="mt-16 text-4xl font-bold leading-tight tracking-tight">
            Command Center
          </h1>
          <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-md">
            Monitor users, manage files, track revenue, and oversee your entire platform from one unified dashboard.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { label: "Real-time Analytics", desc: "Live platform metrics & charts" },
              { label: "User Management", desc: "Block, unblock, or remove users" },
              { label: "Revenue Insights", desc: "Track subscriptions & earnings" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Shield className="h-4 w-4 text-brand-light" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} NanoFile. Admin access only.
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand shadow-md shadow-brand/25">
              <Shield className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 tracking-tight">NanoFile Admin</p>
              <p className="text-xs text-slate-500">Control Panel</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl tracking-tight">Admin Sign In</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your admin credentials to access the control panel.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-id" className="text-sm font-medium text-slate-800">Admin ID</label>
              <div className="relative mt-1.5 rounded-lg border border-slate-200 bg-white transition focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-brand">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={2} />
                <input
                  id="admin-id"
                  type="number"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full rounded-lg border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  placeholder="e.g. 1"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-slate-800">Password</label>
              <div className="relative mt-1.5 rounded-lg border border-slate-200 bg-white transition focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-brand">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={2} />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-0 bg-transparent py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Authenticating...
                </span>
              ) : (
                "Sign In to Admin Panel"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            This area is restricted to authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
