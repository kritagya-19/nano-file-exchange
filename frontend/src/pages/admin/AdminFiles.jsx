import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { adminFetch } from "../../utils/adminApi";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function getFileIcon(name) {
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  const map = {
    pdf: "📄", doc: "📝", docx: "📝", txt: "📝",
    jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", svg: "🖼️", webp: "🖼️",
    mp4: "🎬", avi: "🎬", mkv: "🎬", mov: "🎬",
    mp3: "🎵", wav: "🎵", ogg: "🎵",
    zip: "📦", rar: "📦", "7z": "📦",
    py: "💻", js: "💻", jsx: "💻", ts: "💻", html: "💻", css: "💻",
  };
  return map[ext] || "📁";
}

export function AdminFiles() {
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("uploaded_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 20, sort_by: sortBy, sort_order: sortOrder });
      if (search) params.set("search", search);
      const res = await adminFetch(`/admin/files?${params}`);
      setFiles(res.files);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  useEffect(() => {
    const interval = setInterval(fetchFiles, 10000);
    return () => clearInterval(interval);
  }, [fetchFiles]);

  async function deleteFile(fileId) {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await adminFetch(`/admin/files/${fileId}`, { method: "DELETE" });
      fetchFiles();
    } catch {}
  }

  function toggleSort(key) {
    if (sortBy === key) {
      setSortOrder(o => o === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">File Management</h1>
        <p className="mt-1 text-sm text-slate-500">View and manage all uploaded files across the platform</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="uploaded_at">Date</option>
          <option value="size">Size</option>
          <option value="file_name">Name</option>
        </select>
        <button
          onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm hover:bg-slate-50 transition"
        >
          {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
        </button>
        <span className="text-xs text-slate-500 font-medium">{total} files</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">File</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => toggleSort("size")}>
                Size {sortBy === "size" && (sortOrder === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => toggleSort("uploaded_at")}>
                Uploaded {sortBy === "uploaded_at" && (sortOrder === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Shared</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" /></td></tr>
            ) : files.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-slate-500">No files found</td></tr>
            ) : (
              files.map((f) => (
                <tr key={f.file_id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getFileIcon(f.file_name)}</span>
                      <span className="text-sm text-slate-900 font-medium truncate max-w-[200px]">{f.file_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-slate-900">{f.owner_name || "Unknown"}</p>
                    <p className="text-[11px] text-slate-500">{f.owner_email}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 font-medium">{formatBytes(f.size)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {f.share_token ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Shared</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Private</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => deleteFile(f.file_id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
