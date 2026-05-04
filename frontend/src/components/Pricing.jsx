import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Zap, Crown, Sparkles, ArrowRight } from "lucide-react";
import { BrushUnderline } from "./BrushUnderline";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Icon / style mapping by plan key
const PLAN_ICONS = { free: Sparkles, pro: Zap, max: Crown };
const PLAN_ICON_GRADIENT = {
  free: "from-slate-400 to-slate-500",
  pro: "from-brand-dark to-brand",
  max: "from-slate-700 to-slate-800",
};
const PLAN_ORDER = ["free", "pro", "max"];
const PLAN_TAGLINES = {
  free: "Perfect to get started",
  pro: "For power users & teams",
  max: "For enterprises & creators",
};
const PLAN_CTA = {
  free: { label: "Get started free", style: "outline" },
  pro: { label: "Upgrade to Pro", style: "primary" },
  max: { label: "Go Max", style: "gold" },
};
const PLAN_BADGES = {
  free: null,
  pro: "Most Popular",
  max: "Best Value",
};

// Features that are disabled (shown as strikethrough) per plan
const DISABLED_FEATURES = {
  free: ["Priority support", "Advanced analytics", "Custom branding", "API access"],
  pro: ["Custom branding", "API access"],
  max: [],
};

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/plans`)
      .then((r) => r.json())
      .then((data) => setPlans(data.plans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fallback to empty if plans not loaded yet
  const planEntries = plans
    ? PLAN_ORDER.filter((k) => plans[k]).map((k) => ({ key: k, ...plans[k] }))
    : [];

  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand/5 via-violet-400/5 to-transparent blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-violet-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm mb-6">
            <span className="text-sm font-bold tracking-wider text-brand uppercase">Pricing</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl mb-5">
            Choose the plan that{" "}
            <span className="relative inline-block text-brand">
              fits your needs
              <BrushUnderline wide />
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Start free and scale as you grow. No hidden fees, no credit card required for the free plan.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 rounded-2xl p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                !annual ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
                annual ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Annual
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        )}

        {/* Plan Cards */}
        {!loading && planEntries.length > 0 && (
          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {planEntries.map((plan) => {
              const Icon = PLAN_ICONS[plan.key] || Sparkles;
              const price = annual ? plan.annual_price : plan.monthly_price;
              const cta = PLAN_CTA[plan.key] || PLAN_CTA.free;
              const isPrimary = cta.style === "primary";
              const isGold = cta.style === "gold";
              const badge = PLAN_BADGES[plan.key];
              const disabledFeatures = DISABLED_FEATURES[plan.key] || [];

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-3xl border bg-white p-8 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 ${
                    isPrimary
                      ? "border-brand shadow-lg shadow-brand/10 ring-2 ring-brand/20"
                      : isGold
                      ? "border-slate-800 shadow-xl shadow-slate-200"
                      : "border-slate-200/80 shadow-sm"
                  }`}
                >
                  {/* Popular Badge */}
                  {badge && (
                    <div
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide shadow-md ${
                        isPrimary
                          ? "bg-gradient-to-r from-brand-dark to-brand text-white"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${PLAN_ICON_GRADIENT[plan.key] || PLAN_ICON_GRADIENT.free} text-white shadow-lg`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-ink">{plan.name}</h3>
                      <p className="text-sm text-muted mt-0.5">{PLAN_TAGLINES[plan.key] || ""}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8 pb-8 border-b border-slate-100">
                    {price === 0 ? (
                      <div>
                        <div className="text-4xl font-extrabold text-ink tracking-tight">Free</div>
                        <p className="text-sm text-muted mt-1">Forever free</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-end gap-1">
                          <span className="text-sm font-semibold text-muted self-start mt-2">₹</span>
                          <span className="text-5xl font-extrabold text-ink tracking-tight">{price}</span>
                          <span className="text-sm text-muted mb-1.5">/mo</span>
                        </div>
                        {annual && (
                          <p className="text-xs text-emerald-600 font-semibold mt-1">
                            Billed annually · Save ₹{(plan.monthly_price - plan.annual_price) * 12}/yr
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-8">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                            isPrimary
                              ? "bg-brand/10 text-brand"
                              : isGold
                              ? "bg-slate-100 text-ink"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                    {disabledFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm opacity-40">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-slate-100">
                          <Check className="h-3 w-3 text-slate-400" strokeWidth={2} />
                        </span>
                        <span className="text-slate-500 line-through">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    to="/register"
                    className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all ${
                      isPrimary
                        ? "bg-gradient-to-r from-brand-dark to-brand text-white shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5"
                        : isGold
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5"
                        : "border border-slate-200 bg-white text-ink hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom social proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted mb-6">Trusted by thousands of students and teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { value: "10K+", label: "Active users" },
              { value: "50M+", label: "Files shared" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "256-bit", label: "Encryption" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-ink tracking-tight">{value}</p>
                <p className="text-xs text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
