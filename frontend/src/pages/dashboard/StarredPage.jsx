import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Download, Trash2 } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../utils/api";

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function StarredPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStarred = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/files/starred");
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch starred files", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStarred(); }, []);

  const handleUnfavorite = async (fileId) => {
    try {
      await apiFetch(`/files/${fileId}/favorite`, { method: "PATCH" });
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
    } catch (err) {
      alert("Failed to unfavorite: " + err.message);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem("nanofile_user");
      const parsed = token ? JSON.parse(token) : {};
      const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        headers: parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Starred</h1>
        <p className="mt-1 text-sm text-muted">Quick access to files you marked as favorites.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading…</div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
          <Star className="mx-auto h-10 w-10 text-amber-400" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-ink">No starred items</p>
          <p className="mt-1 text-sm text-muted">Star files from My Files to pin them here.</p>
          <Link to="/dashboard/files" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
            Go to My Files
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">File Name</th>
                <th className="px-6 py-3 font-semibold hidden sm:table-cell">Size</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((f) => (
                <tr key={f.file_id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[220px]">{f.file_name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">{formatSize(f.size)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleDownload(f.file_id, f.file_name)} className="rounded-lg p-2 text-slate-400 hover:text-brand hover:bg-blue-50 transition" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleUnfavorite(f.file_id)} className="rounded-lg p-2 text-amber-400 hover:text-slate-400 hover:bg-slate-100 transition" title="Unstar">
                        <Star className="h-4 w-4" fill="currentColor" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
