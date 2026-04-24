import { Bell, Lock, Palette } from "lucide-react";

const rows = [
  { icon: Bell, title: "Notifications", desc: "Email and in-app alerts for shares and uploads." },
  { icon: Lock, title: "Security", desc: "Password, sessions, and two-factor (when available)." },
  { icon: Palette, title: "Appearance", desc: "Theme and density — wired to preferences later." },
];

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Settings</h2>
        <p className="mt-1 text-sm text-muted">Tune NanoFile to your workflow. These panels are ready for your API.</p>
      </div>

      <ul className="space-y-3">
        {rows.map(({ icon: Icon, title, desc }) => (
          <li
            key={title}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-card-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-muted">{desc}</p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted sm:inline">
              Soon
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
