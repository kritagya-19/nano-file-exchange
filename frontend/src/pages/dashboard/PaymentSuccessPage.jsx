import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  CreditCard,
  Smartphone,
  Receipt,
  Sparkles,
} from "lucide-react";

export function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, planName } = location.state || {};

  // If user directly navigates here without state, redirect
  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-muted mb-4">No payment data found.</p>
        <Link
          to="/dashboard"
          className="text-brand font-semibold hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const renewalDate = subscription.renewal_date
    ? new Date(subscription.renewal_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const purchaseDate = subscription.purchased_at
    ? new Date(subscription.purchased_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="max-w-lg mx-auto pb-12">
      {/* Success animation */}
      <div className="text-center mb-8">
        <div className="relative inline-flex">
          <div className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand text-white shadow-xl shadow-brand/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-ink tracking-tight sm:text-3xl">
          Payment Successful!
        </h1>
        <p className="mt-2 text-base text-muted">
          You're now on the{" "}
          <span className="font-bold text-ink">{planName}</span> plan.
          <br />
          <span className="inline-flex items-center gap-1.5 mt-1">
            <Sparkles className="w-4 h-4 text-brand" />
            Enjoy your upgraded features!
          </span>
        </p>
      </div>

      {/* Receipt card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-7 pt-6 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Payment Receipt</h2>
            <p className="text-xs text-muted">Transaction details</p>
          </div>
        </div>

        <div className="px-7 py-5 space-y-4">
          <ReceiptRow label="Plan" value={`${planName} Plan`} />
          <ReceiptRow
            label="Amount"
            value={`₹${subscription.amount_paid?.toFixed(2)}`}
          />
          <ReceiptRow
            label="Billing"
            value={
              subscription.billing_cycle === "annual" ? "Annual" : "Monthly"
            }
          />
          <ReceiptRow
            label="Payment Method"
            value={
              subscription.payment_method === "card" ? (
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Card ending in {subscription.card_last4}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  UPI
                </span>
              )
            }
          />
          <ReceiptRow
            label="Purchase Date"
            value={
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {purchaseDate}
              </span>
            }
          />
          <ReceiptRow
            label="Next Renewal"
            value={
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {renewalDate}
              </span>
            }
          />
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-dark to-brand px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/25 hover:shadow-xl transition-all"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/dashboard/pricing", { replace: true })}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-ink hover:bg-slate-50 transition-all"
        >
          View Plans
        </button>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
