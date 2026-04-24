import { Cloud, Download, RefreshCw, Shield, Users, Zap } from "lucide-react";
import { SectionGlow } from "./SectionGlow";

const items = [
  {
    title: "Pause & Resume Uploads",
    description:
      "Lost your internet connection? No worries. Your upload will continue exactly where it stopped. No need to start over.",
    icon: RefreshCw,
    wide: true,
  },
  {
    title: "Access From Anywhere",
    description:
      "Open your files on your phone, laptop, or any computer. Just log in and everything is there waiting for you.",
    icon: Cloud,
    wide: false,
  },
  {
    title: "Share With Your Team",
    description:
      "Create a group, invite your friends or classmates, and share files instantly. Everyone can chat and download together.",
    icon: Users,
    wide: false,
  },
  {
    title: "Your Files Stay Private",
    description:
      "We protect your files with the same security banks use. Only people you share with can see your stuff.",
    icon: Shield,
    wide: true,
  },
  {
    title: "Fast Uploads",
    description: "Upload big files in minutes, not hours. Our system is built for speed so you can get back to work quickly.",
    icon: Zap,
    wide: false,
  },
  {
    title: "Easy Downloads",
    description:
      "Share a link with anyone. They can download without signing up — just click and get the file.",
    icon: Download,
    wide: false,
  },
];

function FeatureIcon({ Icon }) {
  return (
    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
      <Icon className="h-5 w-5" strokeWidth={2} />
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-24">
      <SectionGlow />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Everything you need to share smarter</h2>
          <p className="mt-3 text-muted">
            Powerful features in a clean, simple experience — so you spend less time fighting tools and more time doing
            your work.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {items.map(({ title, description, icon: Icon, wide }) => (
            <article
              key={title}
              className={`rounded-3xl border border-gray-100/80 bg-white p-7 shadow-card-sm transition hover:shadow-card ${
                wide ? "lg:col-span-2" : ""
              }`}
            >
              <FeatureIcon Icon={Icon} />
              <h3 className="text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
