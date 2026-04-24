import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  LogOut,
  Trash2,
  Shield,
  Settings as SettingsIcon,
  KeyRound,
  UserX,
  User as UserIcon,
  Mail,
  Loader2,
  Zap,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export function SettingsPage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("general");
  const [billingStats, setBillingStats] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    if (activeTab === "billing" && !billingStats) {
      setLoadingBilling(true);
      apiFetch("/dashboard/stats")
        .then((data) => setBillingStats(data))
        .catch(() => {})
        .finally(() => setLoadingBilling(false));
    }
  }, [activeTab, billingStats]);

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
  }

  const TABS = [
    { id: "general", label: "General", icon: UserIcon, desc: "Profile & Identity" },
    { id: "account", label: "Account Security", icon: Shield, desc: "Passwords & Sessions" },
    { id: "billing", label: "Billing", icon: Zap, desc: "Plans & Storage" },
  ];

  // Profile details state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: "", type: "" });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [delMessage, setDelMessage] = useState({ text: "", type: "" });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: "", type: "" });

    if (!profileName.trim()) {
      setProfileMessage({ text: "Name cannot be empty", type: "error" });
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await apiFetch("/users/me", {
        method: "PATCH",
        body: { name: profileName },
      });
      // Update the user details in auth context
      login({ ...user, name: res.name, token: res.token || user.token });
      setProfileMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setProfileMessage({ text: "", type: "" }), 4000);
    } catch (err) {
      setProfileMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage({ text: "", type: "" });

    if (!currentPassword.trim()) {
      setPwMessage({ text: "Please enter your current password", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ text: "New password must be at least 6 characters", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    if (currentPassword === newPassword) {
      setPwMessage({ text: "New password must be different from current", type: "error" });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch("/users/me/change-password", {
        method: "POST",
        body: { current_password: currentPassword, new_password: newPassword },
      });
      // Update token in auth context
      if (res.token) {
        login({ ...user, token: res.token });
      }
      setPwMessage({ text: "Password changed successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwMessage({ text: "", type: "" }), 4000);
    } catch (err) {
      setPwMessage({ text: err.message || "Failed to change password", type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDelMessage({ text: "", type: "" });

    if (deleteConfirmText !== "DELETE") {
      setDelMessage({ text: "Please type DELETE to confirm", type: "error" });
      return;
    }
    if (!deletePassword.trim()) {
      setDelMessage({ text: "Please enter your password", type: "error" });
      return;
    }

    setDeleting(true);
    try {
      await apiFetch("/users/me", {
        method: "DELETE",
        body: { password: deletePassword },
      });
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setDelMessage({ text: err.message || "Failed to delete account", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOutEverywhere = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Password strength indicator
  const getPasswordStrength = (pw) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
    if (score <= 2) return { label: "Fair", color: "bg-orange-500", width: "40%" };
    if (score <= 3) return { label: "Good", color: "bg-amber-500", width: "60%" };
    if (score <= 4) return { label: "Strong", color: "bg-emerald-500", width: "80%" };
    return { label: "Very Strong", color: "bg-emerald-600", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-dark to-brand text-white shadow-md shadow-brand/20">
            <SettingsIcon className="w-5 h-5" />
          </div>
          Settings
        </h2>
        <p className="mt-2 text-sm text-muted">Manage your profile, security, and subscription billing.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-4 p-3 rounded-2xl text-left transition-all duration-200 shrink-0 md:shrink border ${
                  activeTab === tab.id
                    ? "bg-white border-slate-200 shadow-sm shadow-slate-200/50"
                    : "border-transparent hover:bg-slate-100/50"
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  activeTab === tab.id ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-400"
                }`}>
                  <tab.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${activeTab === tab.id ? "text-ink" : "text-slate-600"}`}>
                    {tab.label}
                  </p>
                  <p className="text-[11px] text-muted hidden md:block mt-0.5">{tab.desc}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* ─── GENERAL TAB ─── */}
          {activeTab === "general" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Profile Details</h3>
            <p className="text-xs text-muted">Update your public profile information.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
          {profileMessage.text && (
            <div
              className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
                profileMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {profileMessage.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
              {profileMessage.text}
            </div>
          )}

          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-100">
            <div className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-3xl font-black shadow-md shadow-brand/20">
              {profileName ? profileName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <button disabled type="button" className="bg-slate-100/50 text-slate-400 cursor-not-allowed font-semibold px-4 py-2 rounded-xl text-sm border border-slate-200">
                Change Avatar
              </button>
              <p className="text-[11px] text-muted mt-2">Custom avatars are rolling out soon. Defaults to your initials.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
             <div className="flex-1">
              <label className="text-sm font-semibold text-ink block mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-slate-50 border border-slate-200 text-ink text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-400"
                />
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-ink block mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  title="Email cannot be changed"
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-xl px-4 py-3 pr-11 cursor-not-allowed"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingProfile || profileName === user?.name || !profileName.trim()}
            className="w-full sm:w-auto bg-slate-900 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {updatingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {updatingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
            </div>
          )}

          {/* ─── ACCOUNT TAB ─── */}
          {activeTab === "account" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Change Password</h3>
            <p className="text-xs text-muted">Update your password to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
          {/* Notification */}
          {pwMessage.text && (
            <div
              className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
                pwMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {pwMessage.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
              {pwMessage.text}
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="text-sm font-semibold text-ink block mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-50 border border-slate-200 text-ink text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-sm font-semibold text-ink block mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full bg-slate-50 border border-slate-200 text-ink text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength Bar */}
            {newPassword && (
              <div className="mt-2.5">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${strength.color} transition-all duration-500`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-[11px] font-medium text-muted mt-1">
                  Strength: <span className={strength.color.replace("bg-", "text-")}>{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-semibold text-ink block mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`w-full bg-slate-50 border text-ink text-sm rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-1 placeholder:text-slate-400 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : confirmPassword && confirmPassword === newPassword
                    ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200"
                    : "border-slate-200 focus:border-brand focus:ring-brand"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword === newPassword && (
              <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <Check className="w-3 h-3" /> Passwords match
              </p>
            )}
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                <X className="w-3 h-3" /> Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full sm:w-auto bg-gradient-to-r from-brand to-violet-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-brand/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {changingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* ─── Session Management ─── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Sessions</h3>
            <p className="text-xs text-muted">Manage your active sessions and sign out remotely.</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-ink">Current Session</p>
                <p className="text-xs text-muted">This browser · Active now</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Active</span>
          </div>
          <button
            onClick={handleSignOutEverywhere}
            className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-ink hover:border-slate-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Everywhere
          </button>
        </div>
      </div>

      {/* ─── Danger Zone: Delete Account ─── */}
      <div className="rounded-3xl border border-red-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 flex items-center gap-3 bg-red-50/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-red-700">Danger Zone</h3>
            <p className="text-xs text-red-500/80">Irreversible actions. Proceed with extreme caution.</p>
          </div>
        </div>

        <div className="p-6">
          {!showDeleteConfirm ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Delete Account</p>
                <p className="text-xs text-muted mt-0.5">
                  Permanently delete your account and all your files, groups, and shared links.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">This action cannot be undone!</p>
                  <p className="text-xs text-red-600 mt-1">
                    All your files, groups, messages, and account data will be permanently erased.
                  </p>
                </div>
              </div>

              {delMessage.text && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  <X className="w-4 h-4 shrink-0" />
                  {delMessage.text}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-ink block mb-2">
                  Type <span className="text-red-600 font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full bg-slate-50 border border-slate-200 text-ink text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink block mb-2">Enter your password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your account password"
                  className="w-full bg-slate-50 border border-slate-200 text-ink text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== "DELETE" || !deletePassword.trim()}
                  className="flex-1 sm:flex-none bg-red-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete My Account"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteConfirmText("");
                    setDelMessage({ text: "", type: "" });
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
            </div>
          )}

          {/* ─── BILLING TAB ─── */}
          {activeTab === "billing" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink">Subscription Plan</h3>
                      <p className="text-xs text-muted">Manage your billing and plan details.</p>
                    </div>
                  </div>
                  {billingStats && billingStats.current_plan !== "max" && (
                    <button
                      onClick={() => navigate("/dashboard/pricing")}
                      className="hidden sm:flex bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand text-white text-xs font-bold px-4 py-2 rounded-lg items-center gap-2 shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Upgrade
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {loadingBilling ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-brand" />
                    </div>
                  ) : billingStats ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/5 to-transparent">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Current Plan</p>
                          <div className="flex items-end gap-3">
                            <h4 className="text-3xl font-black text-brand tracking-tight capitalize">
                              {billingStats.current_plan}
                            </h4>
                            <span className="text-sm font-semibold text-ink mb-1.5 border border-slate-200 bg-white px-2 py-0.5 rounded-full">
                              {formatBytes(billingStats.storage_limit)} Total
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center sm:border-l border-brand/10 sm:pl-5">
                          <button
                            onClick={() => navigate("/dashboard/pricing")}
                            className="w-full sm:w-auto bg-white border border-slate-200 text-ink text-sm font-semibold px-5 py-2.5 rounded-xl hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            View All Plans <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-ink">Storage Usage</p>
                          <p className="text-xs font-bold text-slate-500">
                            {formatBytes(billingStats.storage_used)} / {formatBytes(billingStats.storage_limit)}
                          </p>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              (billingStats.storage_used / billingStats.storage_limit) * 100 > 90
                                ? "bg-red-500"
                                : (billingStats.storage_used / billingStats.storage_limit) * 100 > 75
                                ? "bg-amber-500"
                                : "bg-gradient-to-r from-brand to-brand-dark"
                            }`}
                            style={{ width: `${Math.min((billingStats.storage_used / billingStats.storage_limit) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          You have used {((billingStats.storage_used / billingStats.storage_limit) * 100).toFixed(1)}% of your available storage.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">Failed to load billing details.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
