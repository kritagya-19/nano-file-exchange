import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Code2,
  File as FileIcon,
  X,
  CheckCircle2,
  UploadCloud,
  Star,
  MoreVertical,
  Share2,
  MoveRight,
  Download,
  Trash2,
  CloudUpload,
  ChevronRight,
  FolderPlus,
  FolderOpen,
  FileStack,
  Search,
  Link2,
  Check,
  Copy
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getFileIconData(name) {
  const ext = name.split(".").pop().toLowerCase();
  const img = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"];
  const doc = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "odt", "rtf"];
  const vid = ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];
  const aud = ["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"];
  const arc = ["zip", "rar", "7z", "tar", "gz", "bz2"];
  const code = ["py", "js", "jsx", "ts", "tsx", "html", "css", "json", "xml", "md", "sql"];
  
  if (img.includes(ext)) return { icon: ImageIcon, bg: "bg-indigo-50", text: "text-indigo-600" };
  if (doc.includes(ext)) return { icon: FileText, bg: "bg-emerald-50", text: "text-emerald-600" };
  if (vid.includes(ext)) return { icon: Film, bg: "bg-rose-50", text: "text-rose-600" };
  if (aud.includes(ext)) return { icon: Music, bg: "bg-amber-50", text: "text-amber-600" };
  if (arc.includes(ext)) return { icon: Archive, bg: "bg-slate-100", text: "text-slate-600" };
  if (code.includes(ext)) return { icon: Code2, bg: "bg-blue-50", text: "text-blue-600" };
  return { icon: FileIcon, bg: "bg-slate-50", text: "text-slate-500" };
}

// ─── PREMIUM MODAL ─────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md scale-100 transform overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl transition-transform animate-in zoom-in-95 duration-200 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors">
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
            className="group relative overflow-hidden rounded-[1.5rem] border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur-md transition-all sm:p-5"
          >
            {!isComplete && !isError && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-brand transition-all duration-300 ease-out" 
                style={{ width: `${pct}%` }} 
              />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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

// ─── FILE CARD COMPONENT ────────────────────────────────────────────────────
function FileCard({ f, onToggleFavorite, onShare, onMove, onDownload, onDelete }) {
  const iconData = getFileIconData(f.file_name);
  const Icon = iconData.icon;
  
  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconData.bg} ${iconData.text}`}>
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
        
        {/* Action Menu (Desktop Hover / Mobile Visible) */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggleFavorite(f.file_id)} className={`p-1.5 rounded-lg transition-colors ${f.is_favorite ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}>
            <Star className="w-4 h-4" fill={f.is_favorite ? "currentColor" : "none"} strokeWidth={f.is_favorite ? 0 : 2} />
          </button>
          <div className="relative group/menu">
            <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white p-1 shadow-xl border border-slate-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
              <button onClick={() => onShare(f.file_id, f.file_name)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button onClick={() => onMove()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <MoveRight className="w-4 h-4" /> Move
              </button>
              <button onClick={() => onDownload(f.file_id, f.file_name)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Download className="w-4 h-4" /> Download
              </button>
              <div className="my-1 border-t border-slate-50" />
              <button onClick={() => onDelete(f.file_id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 truncate text-sm mb-1" title={f.file_name}>{f.file_name}</p>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{formatSize(f.size)}</span>
          <span>{f.uploaded_at ? timeAgo(f.uploaded_at) : "—"}</span>
        </div>
      </div>
      
      {/* Permanent Badges */}
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        {f.is_favorite && <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" title="Favorited" />}
        {f.share_token && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm" title="Shared" />}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export function MyFiles() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState(null);
  const [uploads, setUploads] = useState([]);
  const uploadControllers = useRef({});
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Debounce search input — avoids re-filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

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
      alert(`Failed to delete: ${  err.message}`);
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
      alert(`Download failed: ${  err.message}`);
    }
  };

  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await apiFetch(`/files/${fileId}/favorite`, { method: "PATCH" });
      setFiles((prev) =>
        prev.map((f) => (f.file_id === fileId ? { ...f, is_favorite: res.is_favorite } : f))
      );
    } catch (err) {
      alert(`Failed to toggle favorite: ${  err.message}`);
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
      alert(`Failed to generate share link: ${  err.message}`);
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
      alert(`Failed to create folder: ${  err.message}`);
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
      alert(`Failed to delete folder: ${  err.message}`);
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
      alert(`Failed to move file: ${  err.message}`);
    }
  };

  // ──────── FILTERING ─────────────────────────────────────────────────────
  const filteredFiles = files.filter((f) => {
    const matchSearch = f.file_name.toLowerCase().includes(debouncedQuery.toLowerCase());
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

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* ─── Hero & Quick Actions Bento ─── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Title Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-sm p-8 flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand/5 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-3">
              My Files
            </h1>
            <p className="text-base text-slate-500 max-w-xl">
              Securely store, organize, and share all your documents across your workspace.
            </p>
          </div>
        </div>

        {/* Upload/New Folder Actions */}
        <div className="rounded-[2rem] bg-slate-900 p-6 shadow-xl shadow-slate-900/10 flex flex-col justify-center relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex w-full items-center justify-between rounded-2xl bg-brand px-5 py-4 text-sm font-bold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-dark hover:scale-[1.02]"
            >
              <span className="flex items-center gap-3">
                <CloudUpload className="h-5 w-5" />
                Upload Files
              </span>
              <ChevronRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => setFolderModal(true)}
              className="group flex w-full items-center justify-between rounded-2xl bg-white/10 px-5 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <span className="flex items-center gap-3">
                <FolderPlus className="h-5 w-5 text-slate-300" />
                New Folder
              </span>
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Storage Navigation & Drag Zone ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Folders List */}
        <div className="lg:col-span-2 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-slate-400" /> Directories
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveFolder(null)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${
                activeFolder === null 
                ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <FileStack className="w-4 h-4" />
              Home
            </button>
            
            {folders.map((fo) => (
              <div key={fo.folder_id} className="group flex items-center relative">
                <button
                  onClick={() => setActiveFolder(fo.folder_id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold transition-all border ${
                    activeFolder === fo.folder_id 
                    ? "bg-brand text-white border-brand shadow-md" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <FolderOpen className={`w-4 h-4 ${activeFolder === fo.folder_id ? "opacity-100" : "opacity-70 text-brand"}`} fill={activeFolder === fo.folder_id ? "currentColor" : "none"} />
                  {fo.name}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(fo.folder_id); }}
                  className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                    activeFolder === fo.folder_id
                      ? "text-white/70 hover:text-white hover:bg-white/20"
                      : "text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title="Delete folder"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div 
          className="lg:col-span-1 rounded-[2rem] border border-slate-100 bg-white shadow-sm p-2 relative overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-brand/10 to-indigo-500/10 opacity-0 transition-opacity duration-500 pointer-events-none ${dragOver ? 'opacity-100 animate-pulse' : ''}`} />
          <div className={`h-full w-full rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all duration-300 ${
            dragOver 
            ? "border-brand bg-brand/5 scale-[0.98]" 
            : "border-slate-200 bg-slate-50 hover:border-brand/40"
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 ${dragOver ? "bg-brand text-white shadow-lg shadow-brand/30 scale-110" : "bg-white text-slate-400 shadow-sm"}`}>
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">{dragOver ? "Release to Upload" : "Drag & Drop Files"}</p>
            <p className="text-xs text-slate-500 mt-1">Up to 2GB per file</p>
          </div>
        </div>
      </div>

      {/* ─── Search, Filters & File Grid ─── */}
      <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50/50">
          
          {/* Smart Search */}
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your files..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 shadow-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  filter === id
                    ? "bg-brand/10 text-brand ring-1 ring-brand/30"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:ring-slate-300"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex py-24 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-5">
                <FileStack className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {activeFolder !== null ? "This directory is empty" : "No files found"}
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-sm">
                {query || filter !== 'all' 
                  ? "Try adjusting your search or filter to find what you're looking for." 
                  : "Upload some files or create a folder to get started with your workspace."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((f) => (
                <FileCard 
                  key={f.file_id} 
                  f={f} 
                  onToggleFavorite={handleToggleFavorite} 
                  onShare={handleShare} 
                  onMove={() => setMoveModal({ open: true, fileId: f.file_id })} 
                  onDownload={handleDownload} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadToast uploads={uploads} onCancel={cancelUpload} />

      {/* ── SHARE MODAL ──────────────────────────────────── */}
      <Modal open={shareModal.open} onClose={() => setShareModal({ open: false, url: "", fileName: "" })} title="Share Link Generated!">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-500 mb-4">
            <Link2 className="h-8 w-8" />
          </div>
          <p className="text-sm font-bold text-slate-900 tracking-tight text-center truncate w-full px-4">{shareModal.fileName}</p>
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
          <p className="mt-4 text-xs font-medium text-slate-400 text-center">Share this link directly — no account required to download.</p>
        </div>
      </Modal>

      {/* ── CREATE FOLDER MODAL ──────────────────────────── */}
      <Modal open={folderModal} onClose={() => { setFolderModal(false); setNewFolderName(""); }} title="New Directory">
        <form onSubmit={handleCreateFolder}>
          <label className="text-sm font-bold text-slate-700">Directory Name</label>
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
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-50 disabled:shadow-none"
            >
              Create Directory
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MOVE FILE MODAL ──────────────────────────────── */}
      <Modal open={moveModal.open} onClose={() => setMoveModal({ open: false, fileId: null })} title="Move to Directory">
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          <button
            onClick={() => handleMoveFile(null)}
            className="flex w-full items-center justify-between rounded-xl p-3 transition text-left hover:bg-slate-50 border border-transparent hover:border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center h-10 w-10 bg-slate-100 text-slate-600 rounded-lg"><FileStack className="h-5 w-5" /></div>
              <span className="font-semibold text-slate-800 text-sm">Home Directory</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          {folders.map((fo) => (
            <button
              key={fo.folder_id}
              onClick={() => handleMoveFile(fo.folder_id)}
              className="flex w-full items-center justify-between rounded-xl p-3 transition text-left hover:bg-slate-50 border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center h-10 w-10 bg-brand/10 text-brand rounded-lg"><FolderOpen className="h-5 w-5" /></div>
                <span className="font-semibold text-slate-800 text-sm">{fo.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}
