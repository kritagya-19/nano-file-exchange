import { Building2, GraduationCap, Briefcase } from "lucide-react";
import { BrushUnderline } from "./BrushUnderline";
import { SectionGlow } from "./SectionGlow";

const cards = [
  {
    tag: "Perfect for group projects",
    title: "Students & Study Groups",
    description:
      "Share class notes, presentations, and project files with your classmates. Everyone gets the files they need, even at midnight before the deadline.",
    bullets: ["Share files too big for email", "Create groups for each class", "Works on phones & laptops"],
    stat: "50K+",
    statLabel: "students love NanoFile",
    icon: GraduationCap,
  },
  {
    tag: "Work together from anywhere",
    title: "Remote Teams",
    description:
      "Working from home? Share files with your team no matter where everyone is. Built-in chat keeps everyone on the same page.",
    bullets: ["Send large work files", "Chat with your team", "No more email attachments"],
    stat: "2x",
    statLabel: "faster than email",
    icon: Briefcase,
  },
  {
    tag: "Simple & secure",
    title: "Small Businesses",
    description:
      "Share files with clients and coworkers safely. Your business files are protected and organized in one place.",
    bullets: ["Files stay private", "Control who sees what", "Easy to use for everyone"],
    stat: "99.9%",
    statLabel: "always available",
    icon: Building2,
  },
];

export function ForWhom() {
  return (
    <section id="audience" className="relative overflow-hidden py-20 sm:py-24">
      <SectionGlow />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Built for People{" "}
            <span className="relative inline-block text-brand">
              Like You
              <BrushUnderline />
            </span>
          </h2>
          <p className="mt-3 text-muted">
            Whether you're a student, freelancer, or running a business — NanoFile makes file sharing simple.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.title}
              className="flex flex-col rounded-3xl border border-gray-100/80 bg-white p-8 shadow-card-sm transition hover:shadow-card"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
                <c.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">{c.tag}</p>
              <h3 className="mt-2 text-xl font-bold text-ink">{c.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{c.description}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-muted">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-light" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-gray-100 pt-6">
                <p className="text-2xl font-extrabold text-brand">{c.stat}</p>
                <p className="mt-1 text-sm text-muted">{c.statLabel}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
