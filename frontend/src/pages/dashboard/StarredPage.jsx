import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export function StarredPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Starred</h1>
        <p className="mt-1 text-sm text-muted">Quick access to files and folders you marked as favorites.</p>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
        <Star className="mx-auto h-10 w-10 text-amber-400" strokeWidth={1.5} />
        <p className="mt-4 font-medium text-ink">No starred items</p>
        <p className="mt-1 text-sm text-muted">Star files from My Files to pin them here.</p>
        <Link to="/dashboard/files" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
          Go to My Files
        </Link>
      </div>
    </div>
  );
}
