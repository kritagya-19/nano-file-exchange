import { useState, useEffect, useRef, useCallback } from "react";
import {
  CloudUpload,
  FileStack,
  FileText,
  Image as ImageIcon,
  Search,
  Trash2,
  Download,
  Star,
  Share2,
  FolderPlus,
  FolderOpen,
  X,
  Copy,
  Check,
  UploadCloud,
  Film,
  Music,
  Archive,
  MoveRight,
  MoreVertical,
  CheckCircle2,
  ChevronRight,
  Link2
} from "lucide-react";
import { apiFetch, uploadFileWithProgress, uploadFileChunked, API_BASE_URL } from "../../utils/api";

const CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5 MB

const FILTERS = [
  { id: "all", label: "All Files" },
  { id: "images", label: "Images", icon: ImageIcon, exts: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"] },
  { id: "documents", label: "Documents", icon: FileText, exts: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "odt", "rtf"] },
  { id: "videos", label: "Videos", icon: Film, exts: ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"] },
  { id: "audio", label: "Audio", icon: Music, exts: ["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"] },
  { id: "archives", label: "Archives", icon: Archive, exts: ["zip", "rar", "7z", "tar", "gz", "bz2"] },
];

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  const img = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
  const vid = ["mp4", "mov", "avi", "mkv", "webm"];
  const aud = ["mp3", "wav", "ogg", "flac", "aac"];
  const arc = ["zip", "rar", "7z", "tar", "gz"];
  
  if (img.includes(ext)) {
    return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-500 shadow-sm"><ImageIcon className="h-5 w-5" /></div>;
  }
  if (vid.includes(ext)) {
    return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shadow-sm"><Film className="h-5 w-5" /></div>;
  }
  if (aud.includes(ext)) {
    return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm"><Music className="h-5 w-5" /></div>;
  }
  if (arc.includes(ext)) {
    return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500 shadow-sm"><Archive className="h-5 w-5" /></div>;
  }
  return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-500 shadow-sm"><FileText className="h-5 w-5" /></div>;
}

// ─── PREMIUM MODAL ─────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-md scale-100 transform overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 opacity-70 transition hover:bg-slate-100 hover:text-slate-800 hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING UPLOAD TOAST ─────────────────────────────────────────────────
function UploadToast({ uploads, onCancel }) {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3 w-[calc(100vw-3rem)] sm:w-[350px]">
      {uploads.map((item) => {
        const pct = item.progress || 0;
        const isComplete = item.status === "complete";
        const isError = item.status === "error";

        return (
          <div 
            key={item.id} 
            className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/80 p-4 shadow-xl backdrop-blur-md transition-all sm:p-5"
          >
            {/* Absolute progress background */}
            {!isComplete && !isError && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-brand transition-all duration-300 ease-out" 
                style={{ width: `${pct}%` }} 
              />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isComplete ? "bg-emerald-100 text-emerald-600" : isError ? "bg-red-100 text-red-500" : "bg-blue-100 text-brand animate-pulse"
              }`}>
                {isComplete ? <CheckCircle2 className="h-5 w-5" /> : isError ? <X className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {isError ? <span className="text-red-500">{item.error}</span> : isComplete ? "Upload complete" : `Uploading... ${pct}%`}
                </p>
              </div>

              {!isComplete && !isError && (
                <button 
                  onClick={() => onCancel(item.id)} 
                  className="rounded-full bg-slate-100 p-2 text-slate-400 opacity-0 transition-all hover:bg-red-100 hover:text-red-500 group-hover:opacity-100" 
                  title="Cancel Upload"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export function MyFiles() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState(null);
  const [uploads, setUploads] = useState([]);
  const uploadControllers = useRef({});
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Modals
  const [shareModal, setShareModal] = useState({ open: false, url: "", fileName: "" });
  const [folderModal, setFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [moveModal, setMoveModal] = useState({ open: false, fileId: null });
  const [copied, setCopied] = useState(false);

  // ──────── DATA FETCHING ─────────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeFolder ? `/files?folder_id=${activeFolder}` : "/files";
      const data = await apiFetch(endpoint);
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setLoading(false);
    }
  }, [activeFolder]);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await apiFetch("/folders");
      setFolders(data);
    } catch (err) {
      console.error("Failed to fetch folders", err);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [fetchFiles, fetchFolders]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchFiles();
      fetchFolders();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchFiles, fetchFolders]);

  // ──────── UPLOAD LOGIC ──────────────────────────────────────────────────
  const startUpload = useCallback((file) => {
    const id = crypto.randomUUID();

    setUploads((prev) => [...prev, { id, name: file.name, progress: 0, status: "uploading" }]);

    const onProgress = (pct) => {
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
    };

    if (file.size > CHUNK_THRESHOLD) {
      const controller = uploadFileChunked(file, activeFolder, onProgress);
      uploadControllers.current[id] = controller;

      controller.promise
        .then(() => {
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, status: "complete" } : u)));
          fetchFiles();
        })
        .catch((err) => {
          if (err.message !== "Upload aborted") {
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "error", error: err.message } : u)));
          }
        })
        .finally(() => {
          delete uploadControllers.current[id];
        });
    } else {
      const { xhr, promise } = uploadFileWithProgress(file, activeFolder, onProgress);
      uploadControllers.current[id] = { abort: () => xhr.abort() };

      promise
        .then(() => {
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, status: "complete" } : u)));
          fetchFiles();
        })
        .catch((err) => {
          if (err.message !== "Upload aborted") {
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "error", error: err.message } : u)));
          }
        })
        .finally(() => {
          delete uploadControllers.current[id];
        });
    }
  }, [activeFolder, fetchFiles]);

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files || []);
    selected.forEach(startUpload);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    dropped.forEach(startUpload);
  };

  const cancelUpload = (id) => {
    const ctrl = uploadControllers.current[id];
    if (ctrl && ctrl.abort) ctrl.abort();
    setUploads((prev) => prev.filter((u) => u.id !== id));
    delete uploadControllers.current[id];
  };

  // ──────── FILE ACTIONS ──────────────────────────────────────────────────
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await apiFetch(`/files/${fileId}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
    } catch (err) {
      alert("Failed to delete: " + err.message);
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

  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await apiFetch(`/files/${fileId}/favorite`, { method: "PATCH" });
      setFiles((prev) =>
        prev.map((f) => (f.file_id === fileId ? { ...f, is_favorite: res.is_favorite } : f))
      );
    } catch (err) {
      alert("Failed to toggle favorite: " + err.message);
    }
  };

  const handleShare = async (fileId, fileName) => {
    try {
      const res = await apiFetch(`/files/${fileId}/share`, { method: "POST" });
      setShareModal({ open: true, url: res.share_url, fileName });
      setFiles((prev) =>
        prev.map((f) => (f.file_id === fileId ? { ...f, share_token: res.share_token } : f))
      );
    } catch (err) {
      alert("Failed to generate share link: " + err.message);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareModal.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareModal.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ──────── FOLDER ACTIONS ────────────────────────────────────────────────
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await apiFetch("/folders", { method: "POST", body: { name } });
      setNewFolderName("");
      setFolderModal(false);
      fetchFolders();
    } catch (err) {
      alert("Failed to create folder: " + err.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Delete this folder? Files inside will be moved to root.")) return;
    try {
      await apiFetch(`/folders/${folderId}`, { method: "DELETE" });
      if (activeFolder === folderId) setActiveFolder(null);
      fetchFolders();
      fetchFiles();
    } catch (err) {
      alert("Failed to delete folder: " + err.message);
    }
  };

  const handleMoveFile = async (folderId) => {
    try {
      await apiFetch(`/files/${moveModal.fileId}/move`, {
        method: "PATCH",
        body: { folder_id: folderId },
      });
      setMoveModal({ open: false, fileId: null });
      fetchFiles();
    } catch (err) {
      alert("Failed to move file: " + err.message);
    }
  };

  // ──────── FILTERING ─────────────────────────────────────────────────────
  const filteredFiles = files.filter((f) => {
    const matchSearch = f.file_name.toLowerCase().includes(query.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "all") return true;
    const ext = f.file_name.split(".").pop().toLowerCase();
    const filterObj = FILTERS.find((fl) => fl.id === filter);
    return filterObj?.exts ? filterObj.exts.includes(ext) : true;
  });

  // ──────── CLEAN UP COMPLETED UPLOADS ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status !== "complete"));
    }, 4000);
    return () => clearTimeout(timer);
  }, [uploads]);

  // ──────── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header Area */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Files</h1>
          <p className="mt-2 text-sm text-slate-500">Securely store, organize, and share all your documents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
          <button
            type="button"
            onClick={() => setFolderModal(true)}
            className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow"
          >
            <FolderPlus className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" strokeWidth={2.5} />
            New Folder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative overflow-hidden rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition-all hover:scale-[1.02] hover:bg-brand-dark hover:shadow-brand/40 active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex items-center gap-2">
              <CloudUpload className="h-4 w-4" strokeWidth={2.5} />
              Upload Files
            </span>
          </button>
        </div>
      </div>

      {/* Premium Drag & Drop Area */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 p-1">
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-brand/10 via-purple-500/10 to-brand/10 opacity-0 transition-opacity duration-500 ${dragOver ? 'opacity-100 animate-pulse' : ''}`} 
        />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-[1.8rem] border-2 border-dashed px-6 py-16 text-center transition-all duration-300 ${
            dragOver 
            ? "scale-[0.99] border-brand bg-white/60 shadow-inner backdrop-blur-sm" 
            : "border-slate-200 bg-white hover:border-brand/40 hover:bg-slate-50/50"
          }`}
        >
          <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-3xl transition-all duration-500 ${dragOver ? "scale-110 bg-brand text-white shadow-xl shadow-brand/30" : "bg-slate-100 text-slate-400"}`}>
            <CloudUpload className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {dragOver ? "Drop to instantly upload" : "Drag & drop files here"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            or <button onClick={() => fileInputRef.current?.click()} className="font-semibold text-brand hover:underline">browse your computer</button>
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Supports all file types up to 2GB</p>
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Modern Folder Bubbles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFolder(null)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
              activeFolder === null 
              ? "bg-slate-800 text-white shadow-md" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Overview
          </button>
          
          {folders.map((fo) => (
            <div key={fo.folder_id} className="group flex items-center">
              <button
                onClick={() => setActiveFolder(fo.folder_id)}
                className={`flex items-center gap-2 rounded-l-full px-5 py-2 text-sm font-bold transition-all ${
                  activeFolder === fo.folder_id 
                  ? "bg-brand text-white shadow-md pr-3" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FolderOpen className={`h-4 w-4 ${activeFolder === fo.folder_id ? "opacity-100" : "opacity-50"}`} />
                {fo.name}
              </button>
              <button
                onClick={() => handleDeleteFolder(fo.folder_id)}
                className={`flex h-9 w-9 items-center justify-center rounded-r-full border-l border-white/20 transition-all ${
                  activeFolder === fo.folder_id
                    ? "bg-brand text-white/70 hover:text-white hover:bg-brand-dark"
                    : "bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50"
                }`}
                title="Delete folder"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex w-full items-center gap-3 lg:w-auto">
          {/* Smart Search */}
          <div className="relative flex-1 lg:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2 pt-2">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all sm:text-sm ${
              filter === id
                ? "bg-brand/10 text-brand shadow-sm ring-1 ring-brand/30"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* File List / Empty State */}
      {loading ? (
        <div className="flex py-24 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-brand"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white/50 py-24 shadow-sm backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
            <FileStack className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-800">
            {activeFolder !== null ? "This folder is completely empty" : "You have no files yet"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Drop some files above to start populating this space.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredFiles.map((f) => (
            <div 
              key={f.file_id} 
              className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md sm:flex-row sm:items-center"
            >
              {/* File Icon */}
              <div className="shrink-0 transition-transform group-hover:scale-105">
                {getFileIcon(f.file_name)}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-slate-800" title={f.file_name}>
                  {f.file_name}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md">{formatSize(f.size)}</span>
                  <span>{f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : "—"}</span>
                </div>
              </div>
              
              {/* Actions - fade in on hover on desktop */}
              <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                {/* Favorite */}
                <button
                  onClick={() => handleToggleFavorite(f.file_id)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${f.is_favorite ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}
                  title={f.is_favorite ? "Unfavorite" : "Favorite"}
                >
                  <Star className="h-4 w-4" fill={f.is_favorite ? "currentColor" : "none"} strokeWidth={f.is_favorite ? 0 : 2} />
                </button>
                {/* Share */}
                <button
                  onClick={() => handleShare(f.file_id, f.file_name)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${f.share_token ? "text-cyan-600 bg-cyan-50" : "text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"}`}
                  title="Share Link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                {/* Move */}
                <button
                  onClick={() => setMoveModal({ open: true, fileId: f.file_id })}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="Move"
                >
                  <MoveRight className="h-4 w-4" />
                </button>
                {/* Download */}
                <button
                  onClick={() => handleDownload(f.file_id, f.file_name)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-brand hover:bg-blue-50 transition-all"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                {/* Delete */}
                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                <button
                  onClick={() => handleDelete(f.file_id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadToast uploads={uploads} onCancel={cancelUpload} />

      {/* ── SHARE MODAL ──────────────────────────────────── */}
      <Modal open={shareModal.open} onClose={() => setShareModal({ open: false, url: "", fileName: "" })} title="Share Link Generated!">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-500 mb-4">
            <Link2 className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold text-slate-800 tracking-tight">{shareModal.fileName}</p>
          <div className="mt-6 w-full relative">
            <input
              readOnly
              value={shareModal.url}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-24 text-sm font-medium text-slate-600 focus:outline-none"
            />
            <button
              onClick={copyShareUrl}
              className="absolute right-1.5 top-1.5 bottom-1.5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400">Share this link directly — no account required to download.</p>
        </div>
      </Modal>

      {/* ── CREATE FOLDER MODAL ──────────────────────────── */}
      <Modal open={folderModal} onClose={() => { setFolderModal(false); setNewFolderName(""); }} title="New Folder">
        <form onSubmit={handleCreateFolder}>
          <label className="text-sm font-bold text-slate-700">Folder Name</label>
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all"
            placeholder="e.g. Project Assets"
          />
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFolderModal(false)}
              className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-50 disabled:shadow-none"
            >
              Create Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MOVE FILE MODAL ──────────────────────────────── */}
      <Modal open={moveModal.open} onClose={() => setMoveModal({ open: false, fileId: null })} title="Move to Folder">
        <div className="space-y-2">
          <button
            onClick={() => handleMoveFile(null)}
            className="flex w-full items-center justify-between rounded-xl p-4 transition text-left hover:bg-slate-50 border border-transparent hover:border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center h-10 w-10 bg-slate-100 text-slate-600 rounded-lg"><FileStack className="h-5 w-5" /></div>
              <span className="font-semibold text-slate-800">Home Directory</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>

          {folders.map((fo) => (
            <button
              key={fo.folder_id}
              onClick={() => handleMoveFile(fo.folder_id)}
              className="flex w-full items-center justify-between rounded-xl p-4 transition text-left hover:bg-slate-50 border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center h-10 w-10 bg-brand/10 text-brand rounded-lg"><FolderOpen className="h-5 w-5" /></div>
                <span className="font-semibold text-slate-800">{fo.name}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}
