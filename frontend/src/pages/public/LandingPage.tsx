import { Hero } from "../../components/layout/Hero";
import { FeaturedResorts } from "../../components/resort/FeaturedResorts";
import { DestinationDiscovery } from "../../components/layout/DestinationDiscovery";
import { LocalExpertise } from "../../components/layout/LocalExpertise";
import { Experiences } from "../../components/layout/Experiences";
import { Testimonials } from "../../components/layout/Testimonials";
import { Statistics } from "../../components/layout/Statistics";
import { CTASection } from "../../components/layout/CTASection";

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GuideLandingPage } from "../guide/GuideLandingPage";

export function LandingPage() {
  const { user } = useAuth();

  // Owners should be kept in their dashboard
  if (user?.role === "RESORT_OWNER") {
    return <Navigate to="/dashboard" replace />;
  }

  // Guides get their own specialized landing page
  if (user?.role === "GUIDE") {
    return <GuideLandingPage />;
  }

  return (
    <main className="min-h-screen">
      <Hero />
      <Statistics />
      <FeaturedResorts />
      <LocalExpertise />
      <DestinationDiscovery />
      <Experiences />
      <Testimonials />
      <CTASection />
    </main>
  );
}
