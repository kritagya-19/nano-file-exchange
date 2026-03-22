import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordRuleList } from "../components/PasswordRuleList";
import { useAuth } from "../context/AuthContext";
import { nameFromEmail } from "../utils/displayName";
import { validateEmail, validateLoginForm } from "../utils/validation";

function FieldError({ message, id }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

const fieldIcon = "pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400";

function inputShellClass(invalid) {
  return `relative mt-1.5 rounded-lg border bg-white transition focus-within:ring-2 focus-within:ring-offset-0 ${
    invalid
      ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-200"
      : "border-slate-200 focus-within:border-brand focus-within:ring-blue-100"
  }`;
}

const inputInner =
  "w-full rounded-lg border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0";

const inputInnerPassword = `${inputInner} pr-11`;

export function Login() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);

  if (ready && user?.email) {
    return <Navigate to="/dashboard" replace />;
  }

  const emailError = validateEmail(email);
  const errors = validateLoginForm({ email, password });
  const showEmail = (touched.email || submitted) && emailError;
  const showPasswordError = (touched.password || submitted) && errors.password;

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const next = validateLoginForm({ email, password });
    if (next.email || next.password) return;
    const trimmed = email.trim();
    login({ name: nameFromEmail(trimmed), email: trimmed });
    navigate(from.startsWith("/dashboard") ? from : "/dashboard", { replace: true });
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-slate-800">
            Email Address
          </label>
          <div className={inputShellClass(!!showEmail)}>
            <Mail className={fieldIcon} strokeWidth={2} aria-hidden />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={inputInner}
              placeholder="you@example.com"
              aria-invalid={!!showEmail}
              aria-describedby={showEmail ? "login-email-error" : undefined}
            />
          </div>
          <FieldError message={showEmail ? emailError : ""} id="login-email-error" />
        </div>

        <div>
          <label htmlFor="login-password" className="text-sm font-medium text-slate-800">
            Password
          </label>
          <div className={inputShellClass(!!showPasswordError)}>
            <Lock className={fieldIcon} strokeWidth={2} aria-hidden />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={inputInnerPassword}
              placeholder="••••••••"
              aria-invalid={!!showPasswordError}
              aria-describedby={[showPasswordError ? "login-password-error" : null, "login-password-hint"]
                .filter(Boolean)
                .join(" ")}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
          <FieldError message={showPasswordError ? errors.password : ""} id="login-password-error" />
          <PasswordRuleList password={password} id="login-password-hint" />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Sign In
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200" />
        </div>
        <p className="relative mx-auto w-fit bg-slate-50 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          New to NanoFile?
        </p>
      </div>

      <Link
        to="/register"
        className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
      >
        Create a free account
      </Link>
    </AuthLayout>
  );
}
