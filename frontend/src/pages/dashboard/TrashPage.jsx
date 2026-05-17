import { Trash2 } from "lucide-react";

export function TrashPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Trash</h1>
        <p className="mt-1 text-sm text-muted">Deleted files stay here until you restore them or empty trash.</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-sm">
        <Trash2 className="mx-auto h-10 w-10 text-slate-300" strokeWidth={1.5} />
        <p className="mt-4 font-medium text-ink">Trash is empty</p>
        <p className="mt-1 text-sm text-muted">Items you delete from My Files will appear here for recovery.</p>
      </div>
    </div>
  );
}
