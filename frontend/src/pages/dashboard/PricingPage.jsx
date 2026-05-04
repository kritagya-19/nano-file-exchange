import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  Shield,
  HardDrive,
  Users,
  Share2,
  Clock,
  BarChart3,
  Code2,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Style / icon mapping per plan key
const PLAN_ICONS = { free: Sparkles, pro: Zap, max: Crown };
const PLAN_ICON_GRADIENT = {
  free: "from-slate-400 to-slate-500",
  pro: "from-brand-dark to-brand",
  max: "from-slate-700 to-slate-800",
};
const PLAN_ORDER = ["free", "pro", "max"];
const PLAN_TAGLINES = {
  free: "You're currently on this plan",
  pro: "Perfect for power users",
  max: "For teams & enterprises",
};
const PLAN_CTA = {
  free: { label: "Current Plan", style: "outline" },
  pro: { label: "Upgrade to Pro", style: "primary" },
  max: { label: "Go Max", style: "gold" },
};
const PLAN_BADGES = { free: null, pro: "Most Popular", max: "Best Value" };

// Feature icon mapping — maps feature text patterns to icons
function getFeatureIcon(text) {
  const t = text.toLowerCase();
  if (t.includes("storage") || t.includes("gb") || t.includes("tb")) return HardDrive;
  if (t.includes("group") || t.includes("team")) return Users;
  if (t.includes("shared") || t.includes("link")) return Share2;
  if (t.includes("history") || t.includes("version")) return Clock;
  if (t.includes("api") || t.includes("rest")) return Code2;
  if (t.includes("analytic") || t.includes("file") || t.includes("upload")) return BarChart3;
  if (t.includes("support") || t.includes("encrypt") || t.includes("security")) return Shield;
  return Check;
}

// Disabled features per plan (cosmetic, for strikethrough display)
const DISABLED_FEATURES = {
  free: ["Priority upload speed", "API access", "Custom branding", "Advanced analytics"],
  pro: ["API access", "Custom branding"],
  max: [],
};

export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [subInfo, setSubInfo] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch plans from API (public endpoint)
  useEffect(() => {
    fetch(`${API_BASE_URL}/plans`)
      .then((r) => r.json())
      .then((data) => setPlans(data.plans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch current subscription
  useEffect(() => {
    if (!user?.token) return;
    apiFetch("/subscriptions/me")
      .then((data) => {
        setCurrentPlan(data.plan || "free");
        setSubInfo(data);
      })
      .catch(() => {});
  }, [user?.token]);

  const handleUpgrade = (planId) => {
    navigate(`/dashboard/checkout/${planId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const planEntries = plans
    ? PLAN_ORDER.filter((k) => plans[k]).map((k) => ({ key: k, ...plans[k] }))
    : [];

  // Build comparison table from fetched data
  const featureComparison = plans
    ? [
        { feature: "Storage", free: `${plans.free?.storage_limit_gb || 20} GB`, pro: `${plans.pro?.storage_limit_gb || 300} GB`, max: `${plans.max?.storage_limit_gb >= 1024 ? (plans.max.storage_limit_gb / 1024).toFixed(0) + " TB" : plans.max?.storage_limit_gb + " GB"}` },
        { feature: "Monthly Price", free: "Free", pro: `₹${plans.pro?.monthly_price || 499}`, max: `₹${plans.max?.monthly_price || 1999}` },
        { feature: "Annual Price", free: "Free", pro: `₹${plans.pro?.annual_price || 399}/mo`, max: `₹${plans.max?.annual_price || 1499}/mo` },
        { feature: "Group chats", free: "5", pro: "Unlimited", max: "Unlimited" },
        { feature: "Shared links", free: "20", pro: "Unlimited", max: "Unlimited" },
        { feature: "Upload speed", free: "Standard", pro: "Priority", max: "Maximum" },
        { feature: "File history", free: "❌", pro: "60 days", max: "Forever" },
        { feature: "API access", free: "❌", pro: "❌", max: "✅" },
        { feature: "Custom branding", free: "❌", pro: "❌", max: "✅" },
        { feature: "Advanced analytics", free: "❌", pro: "❌", max: "✅" },
        { feature: "Support level", free: "Community", pro: "Email priority", max: "Dedicated" },
      ]
    : [];

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-semibold text-brand mb-4">
          <Zap className="h-4 w-4" />
          Upgrade your plan
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Unlock{" "}
          <span className="bg-gradient-to-r from-brand-dark to-brand bg-clip-text text-transparent">
            more power
          </span>
        </h1>
        <p className="mt-3 text-base text-muted">
          You're signed in as <span className="font-semibold text-ink">{user?.email}</span>. Choose a plan to level up your NanoFile experience.
        </p>

        {/* Billing Toggle */}
        <div className="mt-6 inline-flex items-center gap-3 bg-slate-100 rounded-2xl p-1.5">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${!annual ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${annual ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            Annual
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {planEntries.map((plan) => {
          const Icon = PLAN_ICONS[plan.key] || Sparkles;
          const price = annual ? plan.annual_price : plan.monthly_price;
          const cta = PLAN_CTA[plan.key] || PLAN_CTA.free;
          const isPrimary = cta.style === "primary";
          const isGold = cta.style === "gold";
          const isCurrent = plan.key === currentPlan;
          const badge = PLAN_BADGES[plan.key];
          const disabledFeatures = DISABLED_FEATURES[plan.key] || [];

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-3xl border bg-white p-7 transition-all duration-300 ${
                isPrimary
                  ? "border-brand shadow-lg shadow-brand/10 ring-2 ring-brand/20 hover:shadow-xl hover:-translate-y-1"
                  : isGold
                  ? "border-slate-800 shadow-md shadow-slate-200/80 hover:shadow-xl hover:-translate-y-1"
                  : "border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {/* Badge */}
              {isCurrent ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-700 px-4 py-1 text-xs font-bold text-white shadow-md">
                  Current Plan
                </div>
              ) : badge ? (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide shadow-md ${
                    isPrimary
                      ? "bg-gradient-to-r from-brand-dark to-brand text-white"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  {badge}
                </div>
              ) : null}

              {/* Header */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${PLAN_ICON_GRADIENT[plan.key] || PLAN_ICON_GRADIENT.free} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">{plan.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{PLAN_TAGLINES[plan.key] || ""}</p>
                </div>
              </div>

              {/* Price */}
              <div className="pb-5 mb-5 border-b border-slate-100">
                {price === 0 ? (
                  <>
                    <span className="text-4xl font-extrabold text-ink">Free</span>
                    <p className="text-xs text-muted mt-1">Forever, no credit card needed</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-sm text-muted font-medium self-start mt-1.5">₹</span>
                      <span className="text-4xl font-extrabold text-ink tracking-tight">{price}</span>
                      <span className="text-sm text-muted mb-1">/mo</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        Save ₹{(plan.monthly_price - plan.annual_price) * 12}/yr billed annually
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {(plan.features || []).map((text) => {
                  const FIcon = getFeatureIcon(text);
                  return (
                    <li key={text} className="flex items-center gap-3 text-sm">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        isPrimary ? "bg-brand/10 text-brand" : isGold ? "bg-slate-100 text-ink" : "bg-slate-100 text-slate-500"
                      }`}>
                        <FIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-slate-700 font-medium">{text}</span>
                    </li>
                  );
                })}
                {disabledFeatures.map((text) => (
                  <li key={text} className="flex items-center gap-3 text-sm opacity-40">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Check className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                    <span className="text-slate-500 line-through">{text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-500 cursor-default">
                  ✓ Active Plan
                </div>
              ) : (
                <button
                  className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all ${
                    isPrimary
                      ? "bg-gradient-to-r from-brand-dark to-brand text-white shadow-lg shadow-brand/25 hover:shadow-xl hover:-translate-y-0.5"
                      : isGold
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5"
                      : "border border-slate-200 bg-white text-ink hover:bg-slate-50 hover:border-slate-300"
                  }`}
                  onClick={() => handleUpgrade(plan.key)}
                >
                  {cta.label}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      {featureComparison.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-slate-50/50 transition-colors"
          >
            <div>
              <h3 className="font-bold text-ink">Compare all features</h3>
              <p className="text-sm text-muted mt-0.5">See a full breakdown of what's included in each plan</p>
            </div>
            <div className={`text-slate-400 transition-transform duration-200 ${showComparison ? "rotate-180" : ""}`}>
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </div>
          </button>

          {showComparison && (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-7 py-4 font-semibold text-muted text-xs uppercase tracking-wider">Feature</th>
                    <th className="text-center px-4 py-4 font-semibold text-slate-600">Free</th>
                    <th className="text-center px-4 py-4 font-bold text-brand">Pro</th>
                    <th className="text-center px-4 py-4 font-bold text-slate-900">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {featureComparison.map(({ feature, free, pro, max }) => (
                    <tr key={feature} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-7 py-4 font-medium text-ink">{feature}</td>
                      <td className="text-center px-4 py-4 text-muted">{free}</td>
                      <td className="text-center px-4 py-4 text-brand font-semibold">{pro}</td>
                      <td className="text-center px-4 py-4 text-slate-900 font-semibold">{max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FAQ / Trust Strip */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
        <Shield className="w-10 h-10 text-white/60 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">30-Day Money-Back Guarantee</h3>
        <p className="text-sm text-white/70 max-w-md mx-auto">
          Not happy with a paid plan? We'll refund you within 30 days, no questions asked.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-white/60">
          {["Cancel anytime", "No hidden fees", "256-bit encryption", "GDPR compliant"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
