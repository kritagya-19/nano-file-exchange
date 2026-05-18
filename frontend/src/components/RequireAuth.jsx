import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (!user?.email) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
