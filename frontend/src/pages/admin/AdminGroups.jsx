import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, Users, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";
import { adminFetch } from "../../utils/adminApi";

export function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 20 });
      if (search) params.set("search", search);
      const res = await adminFetch(`/admin/groups?${params}`);
      setGroups(res.groups);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  async function viewGroup(groupId) {
    try {
      const res = await adminFetch(`/admin/groups/${groupId}`);
      setSelectedGroup(res);
    } catch {}
  }

  async function deleteGroup(groupId) {
    if (!confirm("Delete this group and all its data?")) return;
    try {
      await adminFetch(`/admin/groups/${groupId}`, { method: "DELETE" });
      fetchGroups();
      if (selectedGroup?.group_id === groupId) setSelectedGroup(null);
    } catch {}
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Group Management</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor and manage all groups on the platform</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">{total} groups</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500">No groups found</div>
        ) : (
          groups.map((g) => (
            <div key={g.group_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{g.group_name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">by <span className="font-medium text-slate-700">{g.creator_name || "Unknown"}</span></p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => viewGroup(g.group_id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteGroup(g.group_id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                  {g.member_count} members
                </div>
                <p className="text-[11px] text-slate-500">
                  Created {g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedGroup.group_name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">Created by <span className="font-medium text-slate-700">{selectedGroup.creator_name}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedGroup.created_at ? new Date(selectedGroup.created_at).toLocaleDateString() : ""}
                </p>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Members ({selectedGroup.members?.length || 0})
            </p>
            <div className="space-y-2">
              {(selectedGroup.members || []).map((m) => (
                <div key={m.user_id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase ${m.status === "approved" ? "text-emerald-600" : "text-amber-600"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
              {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-6">No members</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
