import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText, Cloud } from "lucide-react";
import { API_BASE_URL } from "../utils/api";

function formatSize(bytes) {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function ShareDownload() {
  const { token } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/files/shared/${token}/info`);
        if (!res.ok) throw new Error("File not found or link expired");
        const data = await res.json();
        setFileInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  const handleDownload = () => {
    window.open(`${API_BASE_URL}/files/shared/${token}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-600">Link Not Found</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/25">
            <Cloud className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">NanoFile</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand">
            <FileText className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">{fileInfo.file_name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatSize(fileInfo.size)}
            {fileInfo.uploaded_at && ` • Uploaded ${new Date(fileInfo.uploaded_at).toLocaleDateString()}`}
          </p>
          <button
            onClick={handleDownload}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 hover:bg-brand-dark transition"
          >
            <Download className="h-4 w-4" />
            Download File
          </button>
          <p className="mt-4 text-xs text-slate-400">Shared via NanoFile — no account required.</p>
        </div>
      </div>
    </div>
  );
}
