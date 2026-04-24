import { Navigate, useLocation } from "react-router-dom";
import { getAdminToken } from "../utils/adminApi";

export function RequireAdmin({ children }) {
  const location = useLocation();
  const token = getAdminToken();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
