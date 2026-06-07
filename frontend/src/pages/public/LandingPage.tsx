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

export function LandingPage() {
  const { user } = useAuth();

  // Owners and Guides shouldn't see the public landing page, keep them in their dashboard
  if (user?.role === "RESORT_OWNER" || user?.role === "GUIDE") {
    return <Navigate to="/dashboard" replace />;
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
