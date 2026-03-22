import { LifeBuoy, Mail, MessageCircle } from "lucide-react";

export function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Help & Support</h1>
        <p className="mt-1 text-sm text-muted">Guides and contact options for NanoFile.</p>
      </div>
      <ul className="space-y-4">
        <li className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink">Documentation</p>
            <p className="mt-1 text-sm text-muted">Upload limits, sharing links, and group permissions will live here.</p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink">Chat support</p>
            <p className="mt-1 text-sm text-muted">Connect in-app chat when your workspace enables it.</p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink">Email</p>
            <p className="mt-1 text-sm text-muted">support@nanofile.example — replace with your real support address.</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
