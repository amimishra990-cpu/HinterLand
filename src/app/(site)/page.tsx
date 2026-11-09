import { AudienceSection } from "@/components/marketing/audience-section";
import { ClosingSection } from "@/components/marketing/closing-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { Hero } from "@/components/marketing/hero";
import { PrinciplesSection } from "@/components/marketing/principles-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { ProductDemo } from "@/components/marketing/product-demo";
import { RoadmapSection } from "@/components/marketing/roadmap-section";
import { SolutionSection } from "@/components/marketing/solution-section";
import { TechnologyTrustSection } from "@/components/marketing/technology-trust-section";
import { WorkflowSection } from "@/components/marketing/workflow-section";
import { ExperienceSection } from "@/components/3d/experience-section";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <WorkflowSection />
      <ExperienceSection />
      <ProductDemo />
      <PrinciplesSection />
      <AudienceSection />
      <TechnologyTrustSection />
      <RoadmapSection />
      <ClosingSection />
    </main>
  );
}
