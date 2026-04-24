import { useState, useEffect } from "react";
import { Link2, Share2, Copy, Check, Trash2, Download } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../utils/api";

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function Shared() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchShared = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/files/shared-list");
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch shared files", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShared(); }, []);

  const handleCopy = async (token, fileId) => {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (fileId) => {
    if (!window.confirm("Revoke share link? The link will stop working.")) return;
    try {
      await apiFetch(`/files/${fileId}/share`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
    } catch (err) {
      alert("Failed to revoke: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Shared</h2>
        <p className="mt-1 text-sm text-muted">Links and items others can access — control visibility anytime.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading…</div>
      ) : files.length === 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card-sm">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Recent links</p>
          </div>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-brand/10 text-brand">
              <Share2 className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">Nothing shared yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Generate a link from any file in My Files — downloaders won&apos;t need an account.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Active share links</p>
          </div>
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
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 truncate max-w-[220px]">{f.file_name}</p>
                    <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[300px]">
                      {window.location.origin}/share/{f.share_token}
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">{formatSize(f.size)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCopy(f.share_token, f.file_id)}
                        className="rounded-lg p-2 text-slate-400 hover:text-brand hover:bg-blue-50 transition"
                        title="Copy link"
                      >
                        {copiedId === f.file_id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleRevoke(f.file_id)}
                        className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Revoke link"
                      >
                        <Trash2 className="h-4 w-4" />
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
