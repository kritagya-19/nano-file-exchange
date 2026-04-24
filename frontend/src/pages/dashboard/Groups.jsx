import { useState, useEffect, useCallback } from "react";
import { Users, Plus, LayoutGrid, Sparkles, Search, LogIn, Lock } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { useNavigate, Outlet, useParams } from "react-router-dom";

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
         setTimeout(() => setJoinMessage(""), 5000);
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
    <div className="flex h-full w-full bg-white overflow-hidden">
      
      {/* Left Sidebar (Groups List) */}
      <div className={`flex flex-col w-full sm:w-80 md:w-96 border-r border-slate-100 bg-slate-50/50 flex-shrink-0 ${!isBase ? 'hidden sm:flex' : ''}`}>
        
        {/* Header like WhatsApp */}
        <div className="p-4 bg-white flex flex-col gap-4 border-b border-slate-100 z-10">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-[22px] font-bold tracking-tight text-ink">
              Chats
            </h2>
            <button
              onClick={() => { setIsCreating(true); setIsJoining(false); }}
              className="text-slate-400 hover:text-ink transition-colors"
              title="Create Group"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          <div className="relative">
            <input type="text" placeholder="Search or start new chat" className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white transition-all rounded-lg pl-9 pr-4 py-2 text-[14px] outline-none text-slate-600 placeholder:text-slate-400" />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsCreating(true); setIsJoining(false); }} className="flex-1 border border-slate-200 rounded-full py-1.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Group
            </button>
            <button onClick={() => { setIsJoining(true); setIsCreating(false); }} className="flex-1 border border-slate-200 rounded-full py-1.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <LogIn className="w-3.5 h-3.5 cursor-pointer" style={{ transform: 'rotate(180deg)' }} /> Join Group
            </button>
          </div>
        </div>

        {/* Join by ID Dropdown */}
        {isJoining && (
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleJoinById} className="flex gap-2">
              <input
                type="text"
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
                placeholder="Enter Group ID..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-400"
                autoFocus
              />
              <button disabled={!joinGroupId} className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 min-w-max transition-colors">Join</button>
            </form>
            {joinMessage && <p className={`text-[10px] font-bold mt-1.5 px-1 ${joinIsError ? 'text-red-500' : 'text-brand'}`}>{joinMessage}</p>}
          </div>
        )}

        {/* Create Group Dropdown */}
        {isCreating && (
          <div className="p-4 bg-brand/5 border-b border-brand/10">
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group Name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-brand focus:ring-1 focus:ring-brand"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-all">Create</button>
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 rounded-xl bg-slate-200 text-slate-600 py-2 text-xs font-semibold hover:bg-slate-300 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* List of Groups */}
        <div className="flex-1 overflow-y-auto w-full">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-slate-200/50 animate-pulse" />
              ))}
            </div>
          ) : myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-70">
              <LayoutGrid className="h-8 w-8 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 font-medium">No groups yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Create or join one!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {myGroups.map(group => (
                <div 
                  key={group.group_id} 
                  onClick={() => handleOpenGroup(group.group_id)}
                  className={`group relative cursor-pointer p-4 transition-all hover:bg-slate-100 flex items-center gap-3 border-b border-slate-100 ${parseInt(groupId) === group.group_id ? 'bg-brand/5 border-l-4 border-l-brand hover:bg-brand/10' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${parseInt(groupId) === group.group_id ? 'bg-gradient-to-br from-brand-dark to-brand shadow-md shadow-brand/20' : 'bg-slate-300 group-hover:bg-slate-400'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className={`font-bold text-[15px] truncate transition-colors leading-tight ${parseInt(groupId) === group.group_id ? 'text-brand' : 'text-ink'}`}>{group.group_name}</h3>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5 truncate flex items-center gap-1">id: {group.group_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side (Outlet or Placeholder) */}
      <div className={`flex-1 relative bg-white ${isBase ? 'hidden sm:flex flex-col items-center justify-center bg-slate-50/30' : 'flex flex-col'}`} style={isBase ? { backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23e2e8f0\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"1\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"1\"/%3E%3C/g%3E%3C/svg%3E')" } : {}}>
        {isBase ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500 w-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-brand" />
            </div>
            <p className="text-[12.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
            </p>
            <p className="text-[11px] text-brand font-semibold mt-4 tracking-wider uppercase opacity-80">
              Start the conversation
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </div>

    </div>
  );
}
