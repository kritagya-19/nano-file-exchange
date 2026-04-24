import { Cloud, Download, RefreshCw, Shield, Users, Zap } from "lucide-react";
import { SectionGlow } from "./SectionGlow";
import { BrushUnderline } from "./BrushUnderline";

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

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-16 sm:py-24 bg-gray-50/30">
      <SectionGlow />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm mb-6">
            <span className="text-sm font-bold tracking-wider text-brand uppercase">Features</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl mb-5">
            Everything you need to{" "}
            <span className="relative inline-block text-brand">
              share smarter
              <BrushUnderline wide />
            </span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Powerful features in a clean, simple experience — so you spend less time fighting tools and more time doing
            your work.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {items.map(({ title, description, icon: Icon, wide }, index) => (
            <article
              key={title}
              className={`group relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-card shadow-card-sm ${
                wide ? "lg:col-span-2" : "col-span-1"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Subtle background gradient wash on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="mb-8 flex items-start justify-between">
                  {/* Floating Interactive Icon */}
                  <div className="relative z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  
                  {/* Decorative faint icon in the top right for wide bento items */}
                  {wide && (
                    <Icon 
                      className="absolute right-0 top-0 hidden sm:block h-32 w-32 text-brand/5 -mr-4 -mt-4 transition-transform duration-1000 group-hover:scale-110 group-hover:-rotate-6" 
                      strokeWidth={1} 
                      aria-hidden="true" 
                    />
                  )}
                </div>
                
                <div className="relative z-20 transform transition-transform duration-500 group-hover:-translate-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-ink mb-2">{title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed text-muted">{description}</p>
                </div>
              </div>

              {/* Glossy inner ring to give it a premium bento box inset feel */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-gray-900/5 transition-all duration-500 group-hover:ring-brand/20" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
