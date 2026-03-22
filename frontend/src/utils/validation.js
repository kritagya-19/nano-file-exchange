const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const NAME_MIN = 2;
const NAME_MAX = 120;
const PASS_MIN = 8;

export const PASSWORD_RULES = {
  minLength: { test: (p) => p.length >= PASS_MIN, label: `At least ${PASS_MIN} characters` },
  upper: { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  lower: { test: (p) => /[a-z]/.test(p), label: "One lowercase letter" },
  digit: { test: (p) => /\d/.test(p), label: "One number" },
  special: {
    test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p),
    label: "One special character",
  },
};

export function validateName(value) {
  const v = (value ?? "").trim();
  if (!v) return "Name is required.";
  if (v.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters.`;
  if (v.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
  return "";
}

export function validateEmail(value) {
  const v = (value ?? "").trim();
  if (!v) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value) {
  const p = value ?? "";
  if (!p) return "Password is required.";
  for (const key of Object.keys(PASSWORD_RULES)) {
    const { test, label } = PASSWORD_RULES[key];
    if (!test(p)) return `Password must include: ${label.toLowerCase()}.`;
  }
  return "";
}

export function validateConfirmPassword(password, confirm) {
  const c = confirm ?? "";
  if (!c) return "Please confirm your password.";
  if (c !== password) return "Passwords do not match.";
  return "";
}

export function passwordRuleStatus(password) {
  const p = password ?? "";
  return Object.fromEntries(
    Object.entries(PASSWORD_RULES).map(([key, { test, label }]) => [key, { ok: test(p), label }])
  );
}

export function validateLoginForm({ email, password }) {
  return {
    email: validateEmail(email),
    password: validatePassword(password),
  };
}

export function validateRegisterForm({ name, email, password, confirmPassword }) {
  return {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword),
  };
}
