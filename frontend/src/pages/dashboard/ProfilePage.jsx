import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Calendar,
  FolderOpen,
  Users,
  Share2,
  HardDrive,
  Edit3,
  Check,
  X,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import { nameFromEmail } from "../../utils/displayName";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch("/users/me");
      setProfile(data);
      setEditName(data.name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      setMessage({ text: "Name must be at least 2 characters", type: "error" });
      return;
    }
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await apiFetch("/users/me", {
        method: "PATCH",
        body: { name: editName.trim() },
      });
      // Update auth context with new name and token
      login({ ...user, name: res.name, token: res.token });
      setProfile((prev) => ({ ...prev, name: res.name }));
      setIsEditingName(false);
      setMessage({ text: "Name updated successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: err.message || "Failed to update name", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditingName(false);
    setEditName(profile?.name || "");
    setMessage({ text: "", type: "" });
  };

  const displayName = profile?.name || user?.name?.trim() || nameFromEmail(user?.email || "");
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center animate-pulse">
            <UserRound className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm text-muted font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "Files", value: profile?.total_files || 0, icon: FolderOpen, color: "text-brand", bg: "bg-brand/10" },
    { label: "Groups", value: profile?.active_groups || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Shared", value: profile?.shared_files || 0, icon: Share2, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Storage", value: formatBytes(profile?.storage_used || 0), icon: HardDrive, color: "text-slate-700", bg: "bg-slate-100" },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Profile</h2>
        <p className="mt-1 text-sm text-muted">Manage your account information and view your activity.</p>
      </div>

      {/* Notification */}
      {message.text && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]"></div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
        </div>

        <div className="relative px-6 pb-8 pt-0 sm:px-8">
          <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar + Name */}
            <div className="flex items-end gap-5">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-brand-dark to-brand text-3xl font-extrabold text-white shadow-xl shadow-brand/20 relative">
                {displayName.charAt(0).toUpperCase()}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand border-2 border-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="pb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xl font-bold text-ink bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand w-48"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="p-2 rounded-xl bg-brand text-white hover:bg-brand/90 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-ink">{displayName}</h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                      title="Edit name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-3.5 h-3.5 text-brand" />
                  <span className="text-sm text-brand font-semibold capitalize">{profile?.status || "active"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoCard icon={UserRound} label="Full Name" value={displayName} />
            <InfoCard icon={Mail} label="Email Address" value={user?.email || "—"} />
            <InfoCard icon={Calendar} label="Member Since" value={joinDate} />
            <InfoCard icon={Shield} label="Account Status" value={profile?.status === "active" ? "Active" : "Inactive"} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-ink tracking-tight">{item.value}</p>
            <p className="text-xs font-medium text-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sub-component ── */
function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 font-semibold text-ink truncate">{value}</p>
      </div>
    </div>
  );
}
