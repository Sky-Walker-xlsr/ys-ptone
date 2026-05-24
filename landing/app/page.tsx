import { Navbar }         from '@/components/landing/Navbar';
import { Hero }           from '@/components/landing/Hero';
import { StatsBar }       from '@/components/landing/StatsBar';
import { FeaturesPT }     from '@/components/landing/FeaturesPT';
import { HowItWorks }     from '@/components/landing/HowItWorks';
import { FeaturesClient } from '@/components/landing/FeaturesClient';
import { PTFinder }       from '@/components/landing/PTFinder';
import { CTASection }     from '@/components/landing/CTASection';
import { Footer }         from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <FeaturesPT />
        <HowItWorks />
        <FeaturesClient />
        <PTFinder />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
