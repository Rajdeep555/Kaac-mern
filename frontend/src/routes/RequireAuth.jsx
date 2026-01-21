import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/ui/Loader";

export default function RequireAuth({ allowedRoles }) {
  const location = useLocation();
  const { isAuthed, role, authLoading } = useAuth();

  if (authLoading) {
    return <Loader />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
