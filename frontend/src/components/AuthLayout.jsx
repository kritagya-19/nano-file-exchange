import { Link } from "react-router-dom";
import { CheckCircle2, Cloud, Shield, Zap } from "lucide-react";

const features = [
  { icon: Zap, text: "10GB file uploads" },
  { icon: Shield, text: "Bank-level encryption" },
  { icon: CheckCircle2, text: "Free forever plan" },
];

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-brand px-8 py-10 text-white sm:px-10 sm:py-12 lg:min-h-screen lg:px-12 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          aria-hidden
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-1/4 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5 font-semibold text-white transition hover:opacity-90">
            <Cloud className="h-8 w-8 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="text-xl font-bold tracking-tight">NanoFile</span>
          </Link>

          <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:mt-14">
            Share files without limits
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
            Join thousands of teams who trust NanoFile for secure, lightning-fast file sharing.
          </p>

          <ul className="mt-10 space-y-4 lg:mt-12">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium text-white sm:text-base">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative mt-10 rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm lg:mt-8">
          <blockquote className="text-sm leading-relaxed text-white sm:text-[0.9375rem]">
            &ldquo;NanoFile changed how our team collaborates. No more email attachments or broken links.&rdquo;
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              SK
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Sarah Kim</p>
              <p className="text-xs text-blue-100">Product Lead at TechCorp</p>
            </div>
          </figcaption>
        </figure>
      </div>

      {/* Form panel */}
      <div className="flex min-h-0 flex-col bg-slate-50 px-6 py-8 sm:px-10 sm:py-12 lg:min-h-screen lg:justify-center lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-[420px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand"
          >
            <span aria-hidden>←</span> Back to Home
          </Link>

          <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          <p className="mt-10 text-center text-xs leading-relaxed text-slate-500">
            By continuing, you agree to our{" "}
            <a href="#" className="font-medium text-brand hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium text-brand hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
