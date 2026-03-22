import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-20 top-10 h-[28rem] w-[28rem] rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute right-0 top-32 h-[22rem] w-[22rem] rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              File sharing, reimagined
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Share big files in seconds —{" "}
              <span className="relative inline-block text-brand">
                no stress
                <svg
                  className="pointer-events-none absolute -bottom-1 left-0 right-0 mx-auto h-2.5 w-28 text-brand/80"
                  viewBox="0 0 112 10"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 6c24-3 48-4 72-2 16 1 28 3 32 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              NanoFile helps students, remote teams, and small businesses send large files, chat in groups, and stay
              organized — with pause-and-resume uploads and bank-grade privacy.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-dark"
              >
                Get started free
                <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
              </Link>
              <Link
                to="/#process"
                className="text-base font-semibold text-gray-700 underline-offset-4 hover:text-brand hover:underline"
              >
                See how it works
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              {["Up to 10GB per file", "No credit card to start", "Works on any device"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-white/0 to-violet-500/10 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-card sm:p-8">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
                    <Shield className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Secure upload</p>
                    <p className="text-xs text-muted">Paused? Resume anytime.</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Encrypted
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-100" />
                  <div className="min-w-0 flex-1">
                    <div className="h-2.5 w-3/4 max-w-[200px] rounded-full bg-gray-200" />
                    <div className="mt-2 h-2 w-1/2 rounded-full bg-gray-100" />
                  </div>
                  <span className="text-xs font-medium text-brand">78%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-brand to-brand-light" />
                </div>
                <p className="text-center text-xs text-muted">Drag & drop — we save your progress automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
