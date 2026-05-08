import { useState, useEffect, useCallback } from "react";
import { Users, Plus, LayoutGrid, Search, LogIn, Lock, X, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { useNavigate, Outlet, useParams } from "react-router-dom";

// ─── PREMIUM MODAL ─────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-sm scale-100 transform overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl transition-transform animate-in zoom-in-95 duration-200 m-4"
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

export function Groups() {
  const [myGroups, setMyGroups] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinGroupId, setJoinGroupId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinIsError, setJoinIsError] = useState(false);
  
  const navigate = useNavigate();
  const { groupId } = useParams();
  const isBase = !groupId;

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const myRes = await apiFetch("/groups");
      setMyGroups(myRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    try {
      await apiFetch("/groups", {
        method: "POST",
        body: { group_name: newGroupName }
      });
      setNewGroupName("");
      setIsCreating(false);
      fetchGroups();
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const handleJoinById = async (e) => {
    e.preventDefault();
    if (!joinGroupId.trim()) return;
    try {
      const res = await apiFetch(`/groups/${joinGroupId}/join`, { method: "POST" });
      if (res.message) {
         setJoinIsError(false);
         setJoinMessage(res.message);
         setTimeout(() => { setJoinMessage(""); setIsJoining(false); }, 2000);
      }
      setJoinGroupId("");
      fetchGroups();
    } catch (err) {
      const errorMsg = err.message || "Failed to join group. Please check the Group ID and try again.";
      setJoinIsError(true);
      setJoinMessage(errorMsg);
      setTimeout(() => setJoinMessage(""), 5000);
      console.error("Failed to join group by id", err);
    }
  };

  const handleOpenGroup = (group_id) => {
    navigate(`/dashboard/groups/${group_id}`);
  };

  return (
    <div className="h-full w-full animate-in fade-in duration-500">
      <div className="flex h-full w-full overflow-hidden bg-white">
        
        {/* Left Sidebar (Groups List) */}
        <div className={`flex flex-col w-full sm:w-[340px] md:w-[380px] border-r border-slate-100 bg-slate-50/30 flex-shrink-0 ${!isBase ? 'hidden sm:flex' : ''}`}>
          
          {/* Header */}
          <div className="p-6 pb-4 flex flex-col gap-5 border-b border-slate-100/60 bg-white/50 backdrop-blur-md z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Team Chat
              </h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsJoining(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                  title="Join Group"
                >
                  <LogIn className="w-5 h-5" style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-2 rounded-xl bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-dark hover:-translate-y-0.5 transition-all"
                  title="Create Group"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full bg-slate-100/50 border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:bg-white transition-all rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400 shadow-sm" 
              />
            </div>
          </div>

          {/* List of Groups */}
          <div className="flex-1 overflow-y-auto w-full p-3 space-y-1 custom-scrollbar bg-slate-50/20">
            {isLoading ? (
              <div className="p-2 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-slate-200/50 animate-pulse" />
                ))}
              </div>
            ) : myGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-80">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 shadow-sm">
                  <MessageSquare className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-800 font-bold">No conversations</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Create a new group or join an existing one to start chatting.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {myGroups.map(group => {
                  const isActive = parseInt(groupId) === group.group_id;
                  return (
                    <div 
                      key={group.group_id} 
                      onClick={() => handleOpenGroup(group.group_id)}
                      className={`group relative cursor-pointer p-3 rounded-2xl transition-all flex items-center gap-4 border ${
                        isActive 
                        ? 'bg-brand shadow-md shadow-brand/20 border-brand' 
                        : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center font-bold transition-all shadow-sm ${
                        isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-to-br from-indigo-50 to-brand/10 text-brand group-hover:from-indigo-100 group-hover:to-brand/20'
                      }`}>
                        {group.group_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h3 className={`font-bold text-[15px] truncate transition-colors leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {group.group_name}
                        </h3>
                        <p className={`text-[12px] font-medium mt-0.5 truncate flex items-center gap-1 ${isActive ? 'text-brand-light opacity-90' : 'text-slate-400'}`}>
                          Workspace ID: {group.group_id}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Outlet or Placeholder) */}
        <div className={`flex-1 relative bg-white border-l border-slate-100 ${isBase ? 'hidden sm:flex flex-col items-center justify-center' : 'flex flex-col'}`}>
          {isBase ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-50/50">
              {/* Decorative Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/5 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="text-center animate-in fade-in zoom-in-95 duration-500 w-full flex flex-col items-center justify-center relative z-10 max-w-md px-6">
                <div className="relative mb-8">
                  <div className="absolute -inset-4 bg-brand/10 blur-xl rounded-full"></div>
                  <div className="w-24 h-24 bg-gradient-to-br from-brand to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-brand/30 relative transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Nano Secure Chat</h2>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Select a group from the sidebar to start messaging. All messages and file transfers are securely encrypted.
                </p>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Lock className="w-3.5 h-3.5" /> End-to-end Encrypted
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>

      </div>

      {/* ── CREATE GROUP MODAL ──────────────────────────── */}
      <Modal open={isCreating} onClose={() => { setIsCreating(false); setNewGroupName(""); }} title="Create New Workspace">
        <form onSubmit={handleCreateGroup}>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-[1.5rem] flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
          <label className="text-sm font-bold text-slate-700">Workspace Name</label>
          <input
            type="text"
            autoFocus
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all"
            placeholder="e.g. Design Team, Engineering"
          />
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">Cancel</button>
            <button type="submit" disabled={!newGroupName.trim()} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-50 disabled:shadow-none">Create Group</button>
          </div>
        </form>
      </Modal>

      {/* ── JOIN GROUP MODAL ────────────────────────────── */}
      <Modal open={isJoining} onClose={() => { setIsJoining(false); setJoinGroupId(""); setJoinMessage(""); }} title="Join a Workspace">
        <form onSubmit={handleJoinById}>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-[1.5rem] flex items-center justify-center">
              <LogIn className="w-8 h-8" style={{ transform: 'rotate(180deg)' }} />
            </div>
          </div>
          <label className="text-sm font-bold text-slate-700">Workspace ID</label>
          <input
            type="text"
            autoFocus
            value={joinGroupId}
            onChange={(e) => setJoinGroupId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all"
            placeholder="Enter the ID provided by the admin"
          />
          {joinMessage && (
            <p className={`text-xs font-bold mt-3 px-1 ${joinIsError ? 'text-red-500' : 'text-emerald-500'}`}>
              {joinMessage}
            </p>
          )}
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={() => setIsJoining(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">Cancel</button>
            <button type="submit" disabled={!joinGroupId.trim()} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none">Join Group</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
