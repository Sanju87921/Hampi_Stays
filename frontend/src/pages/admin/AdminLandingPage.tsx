import { Hero } from "../../components/layout/Hero";
import { Statistics } from "../../components/layout/Statistics";
import { LocalExpertise } from "../../components/layout/LocalExpertise";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AdminLandingPage() {
  const { user } = useAuth();

  if (user?.role === "RESORT_OWNER") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-navy-950">
      <Hero />
    </main>
  );
}
