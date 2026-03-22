import { Github, Twitter } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#process", label: "How it works" },
      { href: "#cta", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Security" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#0f172a] text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <a href="#" className="flex items-center gap-2 font-semibold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold">N</span>
              NanoFile
            </a>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Simple, fast file sharing for students, teams, and businesses. Share big files without the headache.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-400 transition hover:border-white/20 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-400 transition hover:border-white/20 hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{c.title}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-gray-400 transition hover:text-white">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-gray-500 sm:text-left">
          © {new Date().getFullYear()} NanoFile. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
