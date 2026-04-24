import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordRuleList } from "../components/PasswordRuleList";
import { useAuth } from "../context/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation";
import { apiFetch } from "../utils/api";

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

export function Register() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");
  const from = redirectParam || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [submitted, setSubmitted] = useState(false);

  if (ready && user?.email) {
    return <Navigate to={from} replace />;
  }

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const confirmError = validateConfirmPassword(password, confirmPassword);

  const showName = (touched.name || submitted) && nameError;
  const showEmail = (touched.email || submitted) && emailError;
  const showPasswordError = (touched.password || submitted) && passwordError;
  const showConfirmError = (touched.confirmPassword || submitted) && confirmError;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (nameError || emailError || passwordError || confirmError) return;
    
    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: { 
          name: name.trim(), 
          email: email.trim(), 
          password 
        }
      });
      
      login({ 
        token: response.token,
        user_id: response.user_id,
        name: response.name, 
        email: response.email 
      });
      navigate(from, { replace: true });
    } catch (err) {
      alert(err.message || "Failed to create account. Email might already be taken.");
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start sharing files smarter in seconds">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="register-name" className="text-sm font-medium text-slate-800">
            Full Name
          </label>
          <div className={inputShellClass(!!showName)}>
            <UserRound className={fieldIcon} strokeWidth={2} aria-hidden />
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={inputInner}
              placeholder="John Doe"
              aria-invalid={!!showName}
              aria-describedby={showName ? "register-name-error" : undefined}
            />
          </div>
          <FieldError message={showName ? nameError : ""} id="register-name-error" />
        </div>

        <div>
          <label htmlFor="register-email" className="text-sm font-medium text-slate-800">
            Email Address
          </label>
          <div className={inputShellClass(!!showEmail)}>
            <Mail className={fieldIcon} strokeWidth={2} aria-hidden />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={inputInner}
              placeholder="you@example.com"
              aria-invalid={!!showEmail}
              aria-describedby={showEmail ? "register-email-error" : undefined}
            />
          </div>
          <FieldError message={showEmail ? emailError : ""} id="register-email-error" />
        </div>

        <div>
          <label htmlFor="register-password" className="text-sm font-medium text-slate-800">
            Password
          </label>
          <div className={inputShellClass(!!showPasswordError)}>
            <Lock className={fieldIcon} strokeWidth={2} aria-hidden />
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={inputInnerPassword}
              placeholder="••••••••"
              aria-invalid={!!showPasswordError}
              aria-describedby={[showPasswordError ? "register-password-error" : null, "register-password-hint"]
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
          <FieldError message={showPasswordError ? passwordError : ""} id="register-password-error" />
          <PasswordRuleList password={password} id="register-password-hint" />
        </div>

        <div>
          <label htmlFor="register-confirm" className="text-sm font-medium text-slate-800">
            Confirm Password
          </label>
          <div className={inputShellClass(!!showConfirmError)}>
            <Lock className={fieldIcon} strokeWidth={2} aria-hidden />
            <input
              id="register-confirm"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              className={inputInnerPassword}
              placeholder="••••••••"
              aria-invalid={!!showConfirmError}
              aria-describedby={showConfirmError ? "register-confirm-error" : undefined}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
          <FieldError message={showConfirmError ? confirmError : ""} id="register-confirm-error" />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Create Account
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200" />
        </div>
        <p className="relative mx-auto w-fit bg-slate-50 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Already have an account?
        </p>
      </div>

      <Link
        to={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
        className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
      >
        Sign in to existing account
      </Link>
    </AuthLayout>
  );
}
