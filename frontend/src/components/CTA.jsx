import { Link } from "react-router-dom";
import { ArrowRight, Check, Shield } from "lucide-react";

export function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden py-20 sm:py-24">
      <div className="absolute inset-0 bg-brand" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Ready to Start{" "}
          <span className="relative inline-block">
            Sharing?
            <svg
              className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-[6.5rem] -translate-x-1/2 text-white/90"
              viewBox="0 0 104 12"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7c28-4 56-5 80-2 12 2 16 4 16 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
          Join thousands of students and teams who share files the easy way. Create your free account and share your
          first file in under a minute.
        </p>
        <Link
          to="/register"
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-brand shadow-lg transition hover:bg-blue-50"
        >
          Create Free Account
          <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
        </Link>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/90">
          {["Free forever plan", "No credit card needed", "Ready in 30 seconds"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white/95 sm:text-sm">
          <Shield className="h-4 w-4 shrink-0" />
          Your files are encrypted and secure
        </div>
      </div>
    </section>
  );
}
