import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { TravelerDashboard } from "../../pages/traveler/TravelerDashboard";
import { OwnerDashboard } from "../../pages/owner/OwnerDashboard";
import { GuideDashboard } from "../../pages/guide/GuideDashboard";

export function DashboardSelector() {
  const { user } = useAuth();

  // Ensure role check is case-insensitive and robust
  const role = user?.role?.toUpperCase();

  // ADMIN users are redirected to the Admin Gateway landing page
  // The Command Center (/admin/dashboard) is accessed from there
  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "RESORT_OWNER") {
    return <OwnerDashboard />;
  }

  if (role === "GUIDE") {
    return <GuideDashboard />;
  }

  return <TravelerDashboard />;
}
