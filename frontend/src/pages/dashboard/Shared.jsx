import { Link2, Share2 } from "lucide-react";

export function Shared() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Shared</h2>
        <p className="mt-1 text-sm text-muted">Links and items others can access — control visibility anytime.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Recent links</p>
        </div>
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-brand/10 text-brand">
            <Share2 className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-ink">Nothing shared yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Generate a link from any file — downloaders won&apos;t need an account.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-muted">
            <Link2 className="h-3.5 w-3.5" />
            One-click sharing coming from My files
          </div>
        </div>
      </div>
    </div>
  );
}
