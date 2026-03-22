import { Check } from "lucide-react";
import { passwordRuleStatus } from "../utils/validation";

export function PasswordRuleList({ password, id }) {
  const rules = passwordRuleStatus(password);
  return (
    <ul
      id={id}
      className="mt-2 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600"
    >
      {Object.entries(rules).map(([key, { ok, label }]) => (
        <li key={key} className="flex items-center gap-2">
          <span
            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
              ok ? "bg-emerald-600 text-white" : "bg-slate-300 text-white"
            }`}
          >
            <Check className="h-2 w-2" strokeWidth={3} />
          </span>
          <span className={ok ? "font-medium text-slate-800" : ""}>{label}</span>
        </li>
      ))}
    </ul>
  );
}
