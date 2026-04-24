import { Mail, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { nameFromEmail } from "../../utils/displayName";

export function ProfilePage() {
  const { user } = useAuth();
  const displayName = user?.name?.trim() || nameFromEmail(user?.email || "");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Profile</h2>
        <p className="mt-1 text-sm text-muted">Your account details — connect the API to edit these later.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card-sm">
        <div className="h-28 bg-gradient-to-r from-brand/90 via-indigo-600/90 to-violet-600/80" />
        <div className="relative px-6 pb-8 pt-0 sm:px-8">
          <div className="-mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-brand text-2xl font-bold text-white shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="pb-1">
                <h3 className="text-xl font-bold text-ink">{displayName}</h3>
                <p className="text-sm text-muted">Member</p>
              </div>
            </div>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Name</dt>
                <dd className="mt-0.5 font-medium text-ink">{displayName}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-0.5 truncate font-medium text-ink">{user?.email}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
