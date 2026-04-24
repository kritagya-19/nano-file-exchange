import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/#features", label: "Features" },
  { to: "/#process", label: "How it works" },
  { to: "/#audience", label: "For whom" },
  { to: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav
          className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-card-sm backdrop-blur-md sm:px-6"
          aria-label="Main"
        >
          <Link to="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm">
              N
            </span>
            <span className="text-lg tracking-tight">NanoFile</span>
          </Link>

          <ul className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            {links.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="transition hover:text-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-600 transition hover:text-brand"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex rounded-xl p-2 text-gray-700 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {open && (
          <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg md:hidden">
            <ul className="flex flex-col gap-3 text-sm font-medium text-gray-700">
              {links.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="block py-1" onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="block py-2 text-center font-semibold text-brand"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="mt-1 block rounded-full bg-brand py-3 text-center font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
