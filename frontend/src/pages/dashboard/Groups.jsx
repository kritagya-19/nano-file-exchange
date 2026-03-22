import { MessageCircle, Users } from "lucide-react";

export function Groups() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Groups</h2>
        <p className="mt-1 text-sm text-muted">Collaborate with classmates or teammates in shared spaces.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-dashed border-slate-200/90 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Users className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 font-semibold text-ink">Create a group</h3>
          <p className="mt-2 text-sm text-muted">Invite people by email and keep chats next to your files.</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 font-semibold text-ink">You&apos;re all caught up</h3>
          <p className="mt-2 text-sm text-muted">When you join groups, they&apos;ll show up here with activity at a glance.</p>
        </div>
      </div>
    </div>
  );
}
