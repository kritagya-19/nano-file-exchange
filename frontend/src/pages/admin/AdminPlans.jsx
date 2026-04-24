import { useState, useEffect } from "react";
import { Save, Zap, Crown, Star } from "lucide-react";
import { adminFetch } from "../../utils/adminApi";

const planIcons = { free: Star, pro: Zap, max: Crown };
const planColors = {
  free: "from-slate-50 to-slate-100/50 border-slate-200",
  pro: "from-indigo-50/50 to-indigo-100/50 border-indigo-200",
  max: "from-purple-50/50 to-purple-100/50 border-purple-200",
};
const planIconColors = { free: "text-slate-500 bg-white border border-slate-200 shadow-sm", pro: "text-indigo-600 bg-white border border-indigo-100 shadow-sm", max: "text-purple-600 bg-white border border-purple-100 shadow-sm" };

export function AdminPlans() {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/admin/plans")
      .then((res) => setPlans(res.plans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startEdit(key) {
    setEditPlan({ key, ...plans[key] });
    setMessage("");
  }

  function updateField(field, value) {
    setEditPlan((prev) => ({ ...prev, [field]: value }));
  }

  async function savePlan() {
    if (!editPlan) return;
    setSaving(true);
    try {
      await adminFetch(`/admin/plans/${editPlan.key}`, {
        method: "PUT",
        body: {
          storage_limit_gb: parseFloat(editPlan.storage_limit_gb),
          monthly_price: parseFloat(editPlan.monthly_price),
          annual_price: parseFloat(editPlan.annual_price),
          features: editPlan.features,
        },
      });
      setPlans((prev) => ({ ...prev, [editPlan.key]: { ...prev[editPlan.key], ...editPlan } }));
      setMessage("Plan updated successfully!");
      setEditPlan(null);
    } catch (err) {
      setMessage(err.message || "Failed to update");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Plan Management</h1>
        <p className="mt-1 text-sm text-slate-500">Configure subscription plans, pricing, and features</p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium shadow-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Object.entries(plans).map(([key, plan]) => {
          const Icon = planIcons[key] || Star;
          const isEditing = editPlan?.key === key;

          return (
            <div key={key} className={`rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all ${planColors[key] || planColors.free}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${planIconColors[key]}`}>
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{key} plan</p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage (GB)</label>
                    <input
                      type="number"
                      value={editPlan.storage_limit_gb}
                      onChange={(e) => updateField("storage_limit_gb", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly (₹)</label>
                      <input
                        type="number"
                        value={editPlan.monthly_price}
                        onChange={(e) => updateField("monthly_price", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual (₹)</label>
                      <input
                        type="number"
                        value={editPlan.annual_price}
                        onChange={(e) => updateField("annual_price", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Features (one per line)</label>
                    <textarea
                      value={(editPlan.features || []).join("\n")}
                      onChange={(e) => updateField("features", e.target.value.split("\n"))}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={savePlan}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60 shadow-sm"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditPlan(null)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Storage</span>
                      <span className="text-sm font-bold text-slate-900">{plan.storage_limit_gb} GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Monthly</span>
                      <span className="text-sm font-bold text-slate-900">₹{plan.monthly_price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Annual</span>
                      <span className="text-sm font-bold text-slate-900">₹{plan.annual_price}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Features</p>
                    <ul className="space-y-1.5">
                      {(plan.features || []).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span className={`h-1.5 w-1.5 rounded-full ${(planIconColors[key] || "text-slate-500 bg-white border border-slate-200").split(" ")[0].replace("text-", "bg-")} shrink-0`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => startEdit(key)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                  >
                    Edit Plan
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
