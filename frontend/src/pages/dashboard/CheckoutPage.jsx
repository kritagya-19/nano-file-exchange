import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Lock,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Crown,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const PLAN_ICONS = { pro: Zap, max: Crown, free: Sparkles };
const PLAN_GRADIENTS = {
  pro: "from-brand-dark to-brand",
  max: "from-slate-700 to-slate-900",
};

export function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [planData, setPlanData] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [billing, setBilling] = useState("monthly");
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // UPI field
  const [upiId, setUpiId] = useState("");

  // Fetch plan data from API
  useEffect(() => {
    fetch(`${API_BASE_URL}/plans`)
      .then((r) => r.json())
      .then((data) => {
        const plans = data.plans || {};
        if (plans[planId]) {
          setPlanData(plans[planId]);
        } else {
          navigate("/dashboard/pricing", { replace: true });
        }
      })
      .catch(() => navigate("/dashboard/pricing", { replace: true }))
      .finally(() => setLoadingPlan(false));
  }, [planId, navigate]);

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!planData || planId === "free") {
    navigate("/dashboard/pricing", { replace: true });
    return null;
  }

  const price = billing === "annual" ? planData.annual_price : planData.monthly_price;
  const Icon = PLAN_ICONS[planId] || Zap;
  const gradient = PLAN_GRADIENTS[planId] || PLAN_GRADIENTS.pro;

  // Auto-format card number with spaces
  function formatCardNumber(val) {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  // Auto-format expiry
  function formatExpiry(val) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setProcessing(true);

    try {
      const body = {
        plan: planId,
        billing_cycle: billing,
        payment_method: method,
      };

      if (method === "card") {
        if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
          throw new Error("Please fill in all card details.");
        }
        body.card_number = cardNumber;
        body.card_expiry = cardExpiry;
        body.card_cvc = cardCvc;
        body.card_name = cardName;
      } else {
        if (!upiId || !upiId.includes("@")) {
          throw new Error("Please enter a valid UPI ID (e.g. name@upi).");
        }
        body.upi_id = upiId;
      }

      const res = await apiFetch("/subscriptions/checkout", {
        method: "POST",
        body,
      });

      // Navigate to success page with subscription data
      navigate("/dashboard/payment-success", {
        state: { subscription: res.subscription, planName: planData.name },
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard/pricing")}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pricing
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── Left: Payment Form ── */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-slate-100">
              <h1 className="text-xl font-extrabold text-ink tracking-tight">
                Checkout
              </h1>
              <p className="text-sm text-muted mt-1">
                Complete your payment to upgrade to{" "}
                <span className="font-semibold text-ink">{planData.name}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              {/* Billing Toggle */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
                  Billing Cycle
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "monthly", label: "Monthly" },
                    { value: "annual", label: "Annual", badge: "Save 20%" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBilling(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border transition-all ${
                        billing === opt.value
                          ? "border-brand bg-brand/5 text-brand ring-1 ring-brand/20"
                          : "border-slate-200 bg-white text-muted hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                      {opt.badge && billing === opt.value && (
                        <span className="rounded-full bg-brand/10 text-brand text-[10px] font-bold px-2 py-0.5">
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
                  Payment Method
                </label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${
                      method === "card"
                        ? "bg-brand text-white"
                        : "bg-white text-muted hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Credit / Debit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-l border-slate-200 transition-all ${
                      method === "upi"
                        ? "bg-brand text-white"
                        : "bg-white text-muted hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> UPI
                  </button>
                </div>
              </div>

              {/* Card Form */}
              {method === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCardNumber(e.target.value))
                        }
                        maxLength={19}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm font-mono text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
                      />
                      <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) =>
                          setCardExpiry(formatExpiry(e.target.value))
                        }
                        maxLength={5}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-mono text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) =>
                          setCardCvc(
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        maxLength={4}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-mono text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Form */}
              {method === "upi" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                    UPI ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
                    />
                    <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Enter your UPI ID linked to your bank account.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={processing}
                className={`w-full flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                  planId === "max"
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:shadow-xl disabled:opacity-60"
                    : "bg-gradient-to-r from-brand-dark to-brand text-white shadow-lg shadow-brand/25 hover:shadow-xl disabled:opacity-60"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay ₹{price}.00
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 pt-2">
                {[
                  { icon: Lock, label: "SSL Secured" },
                  { icon: Shield, label: "256-bit encryption" },
                  { icon: CheckCircle2, label: "Money-back guarantee" },
                ].map(({ icon: TIcon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-xs text-muted"
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm p-7 sticky top-8">
            <h2 className="text-base font-bold text-ink mb-5">Order Summary</h2>

            {/* Plan Card */}
            <div
              className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white mb-6`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{planData.name} Plan</h3>
                  <p className="text-white/70 text-xs">
                    {billing === "annual" ? "Billed annually" : "Billed monthly"}
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-extrabold">₹{price}</span>
                <span className="text-white/60 text-sm mb-0.5">/mo</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6">
              {(planData.features || []).slice(0, 5).map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  <span className="text-slate-700">{f}</span>
                </li>
              ))}
            </ul>

            {/* Price Breakdown */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-ink">₹{price}.00</span>
              </div>
              {billing === "annual" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Annual discount</span>
                  <span className="font-medium text-brand">-20%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Tax</span>
                <span className="font-medium text-ink">₹0.00</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="font-bold text-ink">Total</span>
                <span className="text-xl font-extrabold text-ink">
                  ₹{price}.00
                  <span className="text-xs font-medium text-muted ml-1">
                    /mo
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
