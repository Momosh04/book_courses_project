import { Navigate } from "react-router-dom";
import { getSession } from "../state/session";

export function ProtectedRoute({
  children,
  requireAdmin
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && session.user.role !== "ADMIN") {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
}
