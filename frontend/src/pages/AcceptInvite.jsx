import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Users, CheckCircle2, XCircle, Loader2, LogIn, UserPlus } from "lucide-react";

export function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [status, setStatus] = useState("loading"); // loading, info, accepting, success, error, not_found
  const [message, setMessage] = useState("");
  const [groupId, setGroupId] = useState(null);

  // 1. Fetch invitation info (public, no auth needed)
  useEffect(() => {
    fetchInviteInfo();
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const data = await apiFetch(`/groups/invite/${token}/info`);
      setInviteInfo(data);
      setStatus("info");
    } catch (err) {
      setStatus("not_found");
      setMessage(err.message || "Invitation not found or has expired.");
    }
  };

  // 2. Accept the invitation
  const handleAccept = async () => {
    setStatus("accepting");
    try {
      const result = await apiFetch(`/groups/invite/${token}/accept`, { method: "POST" });
      setGroupId(result.group_id);
      setMessage(result.message);
      setStatus("success");
    } catch (err) {
      setMessage(err.message || "Failed to accept invitation.");
      setStatus("error");
    }
  };

  // If user is not logged in, show login/register prompt
  if (!user && status !== "loading" && status !== "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-brand to-blue-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Group Invitation</h1>
            {inviteInfo && (
              <p className="text-blue-100 mt-2 text-sm">
                <strong className="text-white">{inviteInfo.inviter_name}</strong> invited you to join <strong className="text-white">"{inviteInfo.group_name}"</strong>
              </p>
            )}
          </div>

          <div className="p-8 text-center">
            <p className="text-slate-600 mb-6">You need to log in or create an account to join this group.</p>
            <div className="flex flex-col gap-3">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="flex items-center justify-center gap-2 bg-brand text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all"
              >
                <LogIn className="w-5 h-5" /> Log In
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="flex items-center justify-center gap-2 bg-white text-ink font-bold py-3 px-6 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
              >
                <UserPlus className="w-5 h-5" /> Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand to-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Group Invitation</h1>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-slate-500">Loading invitation details...</p>
            </div>
          )}

          {status === "info" && inviteInfo && (
            <div className="text-center">
              <p className="text-slate-600 mb-2 text-lg">
                <strong className="text-ink">{inviteInfo.inviter_name}</strong> has invited you to join
              </p>
              <h2 className="text-2xl font-extrabold text-brand mb-6">"{inviteInfo.group_name}"</h2>
              <p className="text-sm text-slate-400 mb-8">Invitation sent to: {inviteInfo.invited_email}</p>
              <button
                onClick={handleAccept}
                className="w-full bg-brand text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-0.5 transition-all text-base"
              >
                Accept & Join Group
              </button>
            </div>
          )}

          {status === "accepting" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-slate-500">Joining the group...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-extrabold text-ink mb-2">You're In! 🎉</h2>
              <p className="text-slate-500 mb-6">{message}</p>
              <button
                onClick={() => navigate(`/dashboard/groups/${groupId}`)}
                className="w-full bg-brand text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all"
              >
                Open Group Chat
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-extrabold text-ink mb-2">Oops!</h2>
              <p className="text-slate-500 mb-6">{message}</p>
              <button
                onClick={() => navigate("/dashboard/groups")}
                className="w-full bg-slate-100 text-ink font-bold py-3 px-6 rounded-2xl hover:bg-slate-200 transition-all"
              >
                Go to My Groups
              </button>
            </div>
          )}

          {status === "not_found" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-extrabold text-ink mb-2">Invitation Not Found</h2>
              <p className="text-slate-500 mb-6">{message}</p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-slate-100 text-ink font-bold py-3 px-6 rounded-2xl hover:bg-slate-200 transition-all"
              >
                Go Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
