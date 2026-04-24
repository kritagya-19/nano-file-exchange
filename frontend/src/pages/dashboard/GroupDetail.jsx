import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Star, Smile, Users, Info, MoreVertical, File as FileIcon, Download, X, Copy, Trash2, ShieldCheck, Ban, Mail } from "lucide-react";
import { apiFetch, uploadFileWithProgress } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [group, setGroup] = useState(null);
  
  const [messageText, setMessageText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [activeDeleteId, setActiveDeleteId] = useState(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(""); // "", sending, sent, error
  const [inviteMessage, setInviteMessage] = useState("");
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    // Reset state when switching groups
    setLoading(true);
    setAccessDenied(false);
    setGroup(null);
    setMembers([]);
    setMessages([]);
    setRequests([]);

    let interval = null;

    // Step 1: confirm user has access to this group first
    fetchGroupInfo().then((hasAccess) => {
      if (!hasAccess) return; // access denied, stop here
      // Step 2: fire secondary fetches in parallel only if access confirmed
      fetchMembers();
      fetchRequests();
      fetchMessages();
      
      // Only start polling AFTER access is confirmed
      interval = setInterval(() => {
        fetchMessages(false);
      }, 5000);
    }).finally(() => setLoading(false));
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [groupId]);

  // Returns true if user has confirmed access, false otherwise
  const fetchGroupInfo = async () => {
    try {
      const current = await apiFetch(`/groups/${groupId}`);
      setGroup(current);
      return true;
    } catch (err) {
      console.error(err);
      setAccessDenied(true);
      return false;
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (accessDenied) return;
    try {
      const data = await apiFetch(`/chat/${groupId}`);
      setMessages(data);
    } catch (err) {
      // Group deleted or membership revoked should immediately lock this view.
      if (
        err?.status === 403 ||
        err?.status === 404 ||
        err?.message?.includes?.("403") ||
        err?.message?.toLowerCase?.().includes("group not found")
      ) {
        setAccessDenied(true);
      }
      console.error(err);
    }
  };

  const fetchMembers = async () => {
    // Do NOT set accessDenied here — fetchGroupInfo is the sole access arbiter
    try {
      const m = await apiFetch(`/groups/${groupId}/members`);
      setMembers(m);
    } catch (err) {
      // Silently ignore — member list failing shouldn't lock the user out
      console.error("fetchMembers error (non-fatal):", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const reqs = await apiFetch(`/groups/${groupId}/requests`);
      setRequests(reqs);
    } catch (err) {
      // Ignore 403 (expected if not admin)
    }
  };

  const handleApprove = async (userId) => {
    try {
      await apiFetch(`/groups/${groupId}/requests/${userId}/approve`, { method: "POST" });
      fetchRequests();
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId) => {
    try {
      await apiFetch(`/groups/${groupId}/requests/${userId}/reject`, { method: "POST" });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear your chat history for this group? This cannot be undone and only affects your view.")) return;
    
    setIsClearingChat(true);
    try {
      await apiFetch(`/chat/${groupId}/clear/all`, { method: "DELETE" });
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear chat", err);
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this group? All messages, records, and member access will be permanently destroyed. This CANNOT be undone.")) return;
    try {
      await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
      navigate('/dashboard/groups');
    } catch (err) {
      console.error("Failed to delete group", err);
      alert("Failed to delete group");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    const textToSend = messageText;
    setMessageText("");
    
    // Reset textarea height instantly for snappy UX
    const textarea = document.getElementById("chat-textarea");
    if (textarea) textarea.style.height = 'auto';
    
    try {
      await apiFetch(`/chat/${groupId}`, {
        method: "POST",
        body: { content: textToSend, msg_type: "text" }
      });
      fetchMessages(false);
      
      // Native flex-col-reverse anchors us completely securely; if user scrolled up, snap 'em back down to newest msg
      setTimeout(() => {
        const scrollNode = chatScrollRef.current;
        if (scrollNode) scrollNode.scrollTop = 0;
      }, 0);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const { promise } = uploadFileWithProgress(file, null, (prog) => {
      setUploadProgress(prog);
    });

    try {
      const res = await promise;
      // Now send a chat message referencing this file
      await apiFetch(`/chat/${groupId}`, {
        method: "POST",
        body: { 
          content: "Shared a file",
          msg_type: "file",
          file_id: res.file_id
        }
      });
      fetchMessages(false);
    } catch (err) {
      console.error("File upload to group failed", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleStar = async (msgId, isStarred) => {
    try {
      if (isStarred) {
        await apiFetch(`/chat/${groupId}/star/${msgId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/chat/${groupId}/star/${msgId}`, { method: "POST" });
      }
      fetchMessages(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReaction = async (msgId, emoji, hasReacted) => {
    try {
      if (hasReacted) {
        await apiFetch(`/chat/${groupId}/react/${msgId}/${encodeURIComponent(emoji)}`, { method: "DELETE" });
      } else {
        await apiFetch(`/chat/${groupId}/react/${msgId}?emoji=${encodeURIComponent(emoji)}`, { method: "POST" });
      }
      setActiveMessageId(null);
      fetchMessages(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (msgId, deleteForEveryone) => {
    try {
      await apiFetch(`/chat/${groupId}/${msgId}?delete_for_everyone=${deleteForEveryone}`, { method: "DELETE" });
      setActiveDeleteId(null);
      fetchMessages(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyId = () => {
    if (group?.group_id) {
      navigator.clipboard.writeText(group.group_id.toString());
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteStatus("sending");
    setInviteMessage("");
    try {
      await apiFetch(`/groups/${groupId}/invite`, {
        method: "POST",
        body: { email: inviteEmail.trim() }
      });
      setInviteStatus("sent");
      setInviteMessage(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setTimeout(() => { setInviteStatus(""); setInviteMessage(""); }, 4000);
    } catch (err) {
      setInviteStatus("error");
      setInviteMessage(err.message || "Failed to send invitation.");
    }
  };

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200/80 shadow-lg p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-50/50 via-white to-white pointer-events-none"></div>
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center shadow-inner mb-6 relative z-10">
          <Ban className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight relative z-10">Access Denied</h2>
        <p className="text-slate-500 max-w-md mx-auto text-base mb-8 relative z-10">
          You don't have permission to view this group. You might not be a member, or the group may have been deleted.
        </p>
        <button 
          onClick={() => navigate('/dashboard/groups')}
          className="bg-brand text-white font-semibold py-3 px-8 rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-0.5 transition-all w-full max-w-[240px] relative z-10 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Go Back
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center animate-pulse">
          <Users className="w-5 h-5 text-brand" />
        </div>
        <p className="text-sm text-muted font-medium animate-pulse">Loading group...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-transparent">
      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all ${isSidebarOpen ? 'hidden sm:flex' : 'flex'}`}>
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200/80 bg-white z-10 shadow-sm relative">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/groups')}
              className="p-2 rounded-xl text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors sm:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-dark to-brand text-white flex items-center justify-center font-bold shadow-md shadow-brand/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-ink leading-tight flex items-center gap-2">
                    {group?.group_name || "Group Chat"}
                    {group?.group_id && (
                      <button onClick={handleCopyId} title="Copy Group ID" className="flex items-center gap-1 text-[9px] bg-slate-100 text-slate-500 hover:text-brand hover:bg-brand/10 font-bold px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">
                        ID: {group.group_id} <Copy className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </h2>
                  <p className="text-[12px] text-slate-500 font-medium leading-tight mt-0.5 truncate max-w-xs">
                    {members.map(m => m.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl transition-all ${isSidebarOpen ? 'bg-gradient-to-tr from-brand-dark to-brand text-white shadow-md shadow-brand/20 scale-105' : 'text-slate-400 hover:text-brand hover:bg-brand/10'}`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages (Reversed for Native Bottom-Anchoring) */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col-reverse gap-3 relative" style={{ backgroundColor: "#f0f2f5", backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23e2e8f0\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"1\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"1\"/%3E%3C/g%3E%3C/svg%3E')" }}>
          {[...messages].reverse().map((msg, revIdx) => {
            const idx = messages.length - 1 - revIdx;
            const isMe = msg.sender_id === user?.user_id;
            const isStarred = msg.stars?.some(s => s.user_id === user?.user_id);
            // Hide sender name if previous message was from the same sender (to group bubbles)
            const showSenderName = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);
            
            // Group reactions by emoji
            const reactionsByEmoji = msg.reactions?.reduce((acc, r) => {
              if (!acc[r.emoji]) acc[r.emoji] = [];
              acc[r.emoji].push(r);
              return acc;
            }, {});

            return (
              <div 
                key={msg.id} 
                className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                
                <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showSenderName && <span className="text-[11px] text-slate-500 font-bold mb-0.5 ml-1">{msg.sender_name}</span>}
                  
                  <div className="flex items-center gap-2 relative">
                    {/* Action buttons appear on hover for sender logic slightly different */}
                    {isMe && !msg.is_deleted_for_everyone && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button onClick={() => setActiveDeleteId(msg.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setActiveMessageId(msg.id)} className="p-1 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-200">
                          <Smile className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleStar(msg.id, isStarred)} className={`p-1 rounded-lg hover:bg-slate-200 ${isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}>
                          <Star className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} />
                        </button>
                      </div>
                    )}
                    
                    {/* Delete Options Popup */}
                    {activeDeleteId === msg.id && (
                      <div className={`absolute top-0 -mt-10 bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col overflow-hidden z-30 min-w-32 ${isMe ? 'right-0' : 'left-0'}`}>
                        <button onClick={() => handleDeleteMessage(msg.id, false)} className="text-xs text-left px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 w-full transition-colors">Delete for me</button>
                        {isMe && <button onClick={() => handleDeleteMessage(msg.id, true)} className="text-xs text-left px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 w-full transition-colors border-t border-slate-100">Delete for everyone</button>}
                      </div>
                    )}

                    <div className={`relative px-3 pt-2 pb-5 min-w-[80px] shadow-sm ${
                      msg.is_deleted_for_everyone
                        ? 'bg-transparent border border-slate-200 text-slate-400 italic shadow-none rounded-xl'
                        : isMe 
                          ? 'bg-brand text-white rounded-l-xl rounded-br-sm rounded-tr-xl before:content-[""] before:absolute before:right-[-8px] before:top-0 before:w-0 before:h-0 before:border-l-[12px] before:border-l-brand before:border-b-[12px] before:border-b-transparent' 
                          : 'bg-white text-ink border border-slate-200/60 rounded-r-xl rounded-bl-sm rounded-tl-xl before:content-[""] before:absolute before:left-[-8px] before:top-0 before:w-0 before:h-0 before:border-r-[12px] before:border-r-white before:border-b-[12px] before:border-b-transparent pb-6'
                    }`}>
                      
                      {msg.is_deleted_for_everyone ? (
                        <div className="flex items-center gap-1.5 pb-2">
                           <Ban className="w-3.5 h-3.5 opacity-50" />
                           <p className="text-[13px]">This message was deleted</p>
                        </div> 
                      ) : msg.msg_type === 'file' ? (
                        <div className="flex flex-col gap-1.5 pb-2">
                          <div className={`p-2.5 rounded-lg flex items-center gap-3 ${isMe ? 'bg-black/10' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20 text-white flex-shrink-0' : 'bg-brand/10 text-brand flex-shrink-0'}`}>
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className={`text-[13px] font-semibold truncate ${isMe ? 'text-white' : 'text-slate-700'}`} title={msg.file_name}>{msg.file_name || "Attachment"}</p>
                              <p className={`text-[11px] opacity-80 ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>Document</p>
                            </div>
                            <a href={`http://localhost:8000${msg.file_url}`} download target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-md hover:bg-black/10 transition-colors ${isMe ? 'text-white' : 'text-brand'}`}>
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                          {msg.content !== "Shared a file" && <p className="text-[14.5px] leading-snug mt-1 pr-4">{msg.content}</p>}
                        </div>
                      ) : (
                        <p className="text-[14.5px] leading-snug whitespace-pre-wrap pr-[2.5rem] pb-0.5">{msg.content}</p>
                      )}

                      {/* WhatsApp style Time and Star indicator overlaid at bottom right */}
                      {!msg.is_deleted_for_everyone && (
                        <div className={`absolute bottom-1 right-2 flex items-center gap-1 opacity-80 ${isMe ? 'text-white' : 'text-slate-400'}`}>
                          {isStarred && <Star className="w-2.5 h-2.5 text-amber-400" fill="currentColor" />}
                          <span className="text-[10px] whitespace-nowrap">
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons for receiver */}
                    {!isMe && !msg.is_deleted_for_everyone && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button onClick={() => toggleStar(msg.id, isStarred)} className={`p-1 rounded-lg hover:bg-slate-200 ${isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}>
                          <Star className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => setActiveMessageId(msg.id)} className="p-1 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-200">
                          <Smile className="w-4 h-4" />
                        </button>
                        <button onClick={() => setActiveDeleteId(msg.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Emoji Picker Popup */}
                  {activeMessageId === msg.id && (
                    <div className={`absolute top-0 -mt-12 bg-white border border-slate-200 shadow-lg rounded-2xl flex items-center gap-1 p-2 z-20 ${isMe ? 'right-0' : 'left-0'}`}>
                      {commonEmojis.map(emoji => {
                        const hasReacted = msg.reactions?.some(r => r.emoji === emoji && r.user_id === user?.user_id);
                        return (
                          <button 
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji, hasReacted)}
                            className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg hover:bg-slate-100 transition-transform hover:scale-125 ${hasReacted ? 'bg-brand/10' : ''}`}
                          >
                            {emoji}
                          </button>
                        )
                      })}
                      <button onClick={() => setActiveMessageId(null)} className="ml-1 p-1 text-slate-400 hover:text-ink">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Reactions Display */}
                  {reactionsByEmoji && Object.keys(reactionsByEmoji).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-0 ${isMe ? 'justify-end right-2' : 'justify-start left-2'} relative -top-3 z-10`}>
                      {Object.entries(reactionsByEmoji).map(([emoji, reacts]) => {
                        const hasReacted = reacts.some(r => r.user_id === user?.user_id);
                        return (
                          <button 
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji, hasReacted)}
                            className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border shadow-sm ${hasReacted ? 'bg-brand/10 border-brand/30 text-brand font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            <span>{emoji}</span>
                            <span className="font-medium opacity-80">{reacts.length > 1 ? reacts.length : ''}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#f0f2f5] border-t border-slate-200/60 z-10">
          {isUploading && (
            <div className="mb-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-between shadow-sm">
              <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Uploading file...</span>
              <span className="text-[11px] font-bold text-brand">{uploadProgress}%</span>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-slate-500 hover:text-brand bg-transparent transition-all rounded-full"
            >
              <Paperclip className="w-5 h-5 -rotate-45" />
            </button>
            <textarea
              id="chat-textarea"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message"
              rows={1}
              className="flex-1 bg-white border-none text-ink text-[15px] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-0 placeholder:text-slate-400 shadow-sm resize-none overflow-y-auto max-h-[120px]"
              style={{ minHeight: '48px' }}
            />
            <button 
              type="submit"
              disabled={!messageText.trim() && !isUploading}
              className={`p-3.5 rounded-full transition-all flex-shrink-0 mb-0.5 ${(!messageText.trim() && !isUploading) ? 'bg-transparent text-slate-400 cursor-not-allowed' : 'bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand/90 hover:scale-105'}`}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      <div 
        className={`bg-white border-l border-slate-100 flex flex-col transition-all duration-300 z-50 ${
          isSidebarOpen ? 'absolute right-0 top-0 bottom-0 w-full sm:w-64 sm:relative shadow-2xl sm:shadow-none' : 'w-0 border-transparent opacity-0 overflow-hidden absolute right-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-bold text-ink">Group Info</h3>
          <button onClick={() => setIsSidebarOpen(false)} className="sm:hidden p-1 text-slate-400 hover:text-ink">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-brand-dark to-brand rounded-3xl flex items-center justify-center text-white shadow-lg shadow-brand/20 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-ink text-center">{group?.group_name}</h4>
            <div className="flex flex-col items-center gap-1 mt-1">
              <p className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">ID: {group?.group_id}</p>
              <p className="text-[11px] text-muted">{members.length} participants</p>
            </div>
          </div>

          {requests.length > 0 && group?.created_by === user?.user_id && (
            <div className="space-y-4 mb-8 pb-8 border-b border-slate-100 animate-in fade-in">
              <h5 className="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                Pending Requests 
                <span className="bg-brand text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[9px]">{requests.length}</span>
              </h5>
              <div className="space-y-2">
                {requests.map(req => (
                  <div key={req.user_id} className="flex flex-col gap-2.5 p-3.5 bg-brand/5 border border-brand/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                        {req.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold text-ink truncate flex-1" title={req.name}>{req.name}</p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleApprove(req.user_id)} className="flex-1 bg-brand text-white text-[10px] font-bold py-2 rounded-xl hover:bg-brand/90 transition-all hover:shadow-md hover:shadow-brand/20 hover:-translate-y-0.5">Approve</button>
                      <button onClick={() => handleReject(req.user_id)} className="flex-1 bg-white text-slate-500 border border-slate-200 text-[10px] font-bold py-2 rounded-xl hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-all">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {group?.created_by === user?.user_id && (
            <div className="space-y-3 mb-8 pb-8 border-b border-slate-100">
              <h5 className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Invite via Email
              </h5>
              <form onSubmit={handleInvite} className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-400 transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={inviteStatus === "sending" || !inviteEmail.trim()}
                  className="flex items-center justify-center gap-2 bg-brand text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  {inviteStatus === "sending" ? "Sending..." : "Send Invitation"}
                </button>
              </form>
              {inviteMessage && (
                <p className={`text-[11px] font-medium px-1 ${inviteStatus === "sent" ? "text-emerald-600" : "text-red-500"}`}>
                  {inviteMessage}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Members</h5>
            {members.map(m => {
              const isAdmin = m.user_id === group?.created_by;
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <p className="text-sm font-semibold text-ink truncate flex items-center gap-1">
                      {m.name} {m.user_id === user?.user_id && "(You)"}
                      {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-brand" title="Admin" />}
                    </p>
                    {isAdmin && <span className="text-[10px] text-brand/80 font-medium tracking-wide">ADMIN</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2">
            <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Danger Zone</h5>
            {group?.created_by === user?.user_id && (
              <button 
                onClick={handleDeleteGroup}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 transition-colors w-full justify-center mb-2"
              >
                <Ban className="w-4 h-4" />
                Delete Entire Group
              </button>
            )}
            <button 
              onClick={handleClearChat}
              disabled={isClearingChat || messages.length === 0}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed justify-center"
            >
              <Trash2 className="w-4 h-4" />
              {isClearingChat ? "Clearing..." : "Clear My Chat"}
            </button>
            <p className="text-[10px] text-slate-400 text-center px-2">Clearing chat only hides messages for you. Deleting the group removes everything for everyone.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
