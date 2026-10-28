import './landing.css';
import { LandingNav } from '@/components/sections/LandingNav';
import { Hero } from '@/components/sections/Hero';
import { Problem } from '@/components/sections/Problem';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { FeatureShowcase } from '@/components/sections/FeatureShowcase';
import { Speed } from '@/components/sections/Speed';
import { Bento } from '@/components/sections/Bento';
import { Integrations } from '@/components/sections/Integrations';
import { Privacy } from '@/components/sections/Privacy';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { LandingFooter } from '@/components/sections/LandingFooter';

export default function LandingPage() {
  return (
    <div className="du-landing">
      <LandingNav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <FeatureShowcase />
        <Speed />
        <Bento />
        <Integrations />
        <Privacy />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
