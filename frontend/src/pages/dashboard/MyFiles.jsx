import { useState } from "react";
import { CloudUpload, FileStack, FileText, Image as ImageIcon, Search } from "lucide-react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "videos", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "archives", label: "Archives" },
];

export function MyFiles() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">My Files</h1>
          <p className="mt-1 text-sm text-muted">Upload, organize, and access everything in one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-slate-50"
          >
            New Folder
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 hover:bg-brand-dark"
          >
            <CloudUpload className="h-4 w-4" strokeWidth={2} />
            Upload Files
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in this folder…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-blue-100"
          aria-label="Search files"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
              filter === id
                ? "border-brand bg-blue-50 text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-10 shadow-sm">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand">
            <FileStack className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-ink">No files yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Drag and drop here or use Upload — your files will appear in a sortable grid with share and star actions.
          </p>
        </div>
      </div>
    </div>
  );
}
