import { useState, useEffect, useRef } from "react";
import { CloudUpload, FileStack, FileText, Image as ImageIcon, Search, Trash2, Download } from "lucide-react";
import { apiFetch } from "../../utils/api";

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
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/files");
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiFetch("/files/upload", {
        method: "POST",
        body: formData,
      });
      fetchFiles(); // Refresh list after upload
    } catch (err) {
      alert("Failed to upload file: " + err.message);
    }
    
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    try {
      await apiFetch(`/files/${fileId}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
    } catch (err) {
      alert("Failed to delete file: " + err.message);
    }
  };

  // Filter logic
  const filteredFiles = files.filter(f => {
      const matchSearch = f.file_name.toLowerCase().includes(query.toLowerCase());
      return matchSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">My Files</h1>
          <p className="mt-1 text-sm text-muted">Upload, organize, and access everything in one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileUpload} 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 hover:bg-brand-dark"
          >
            <CloudUpload className="h-4 w-4" strokeWidth={2} />
            Upload File
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your files…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-blue-100"
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

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading files...</div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand">
              <FileStack className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-ink">No files yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Click &quot;Upload File&quot; to start storing your documents in the database.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">File Name</th>
                <th className="px-6 py-4 font-semibold">Size</th>
                <th className="px-6 py-4 font-semibold">Uploaded At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map((f) => (
                <tr key={f.file_id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[200px]" title={f.file_name}>
                    {f.file_name}
                  </td>
                  <td className="px-6 py-4">
                    {(f.size / 1024).toFixed(2)} KB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(f.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <a 
                          href={f.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-brand transition rounded-lg hover:bg-blue-50"
                          title="Download"
                       >
                         <Download className="h-4 w-4" />
                       </a>
                       <button
                         onClick={() => handleDelete(f.file_id)}
                         className="p-2 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                         title="Delete"
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
