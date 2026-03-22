import { Share2, Upload, UserPlus } from "lucide-react";
import { BrushUnderline } from "./BrushUnderline";
import { SectionGlow } from "./SectionGlow";

const steps = [
  {
    n: 1,
    title: "Sign up for free",
    icon: UserPlus,
    description:
      "Create your account in just 30 seconds. All you need is your email — no credit card, no complicated forms.",
    bullets: ["Completely free to start", "No payment info needed", "Ready in seconds"],
  },
  {
    n: 2,
    title: "Upload your files",
    icon: Upload,
    description:
      "Drag and drop any file up to 10GB. If your internet disconnects, don't worry — we'll save your progress automatically.",
    bullets: ["Files up to 10GB", "Uploads never fail", "Works with any file type"],
  },
  {
    n: 3,
    title: "Share with anyone",
    icon: Share2,
    description:
      "Get a link to share with friends, classmates, or your team. They can download instantly — no account needed.",
    bullets: ["One-click sharing", "No signup for downloaders", "Share via link or group"],
  },
];

export function Process() {
  return (
    <section id="process" className="relative overflow-hidden py-20 sm:py-24">
      <SectionGlow />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Get Started in{" "}
            <span className="relative inline-block text-brand">
              3 Easy Steps
              <BrushUnderline wide />
            </span>
          </h2>
          <p className="mt-3 text-muted">No learning curve. If you can send an email, you can use NanoFile.</p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-blue-200 lg:block" aria-hidden />
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((step) => (
              <div key={step.n} className="relative flex flex-col items-center text-center lg:items-stretch lg:text-left">
                <div className="relative z-10 mb-6 flex justify-center lg:mb-8">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-md ring-4 ring-white">
                    {step.n}
                  </span>
                </div>
                <article className="h-full w-full rounded-3xl border border-gray-100/80 bg-white p-8 shadow-card-sm">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white lg:mx-0">
                    <step.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                  <ul className="mt-5 space-y-2.5 text-left text-sm text-muted">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand">
                          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
