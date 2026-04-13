import HeroSection from '../components/landing/HeroSection.jsx';
import FeaturesSection from '../components/landing/FeaturesSection.jsx';
import PopularSportsSection from '../components/landing/PopularSportsSection.jsx';
import TestimonialsSection from '../components/landing/TestimonialsSection.jsx';
import CtaSection from '../components/landing/CtaSection.jsx';
import { features, popularSports, testimonials } from '../data/landingData.js';

const LandingPage = () => {
  

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection features={features} />
      <PopularSportsSection sports={popularSports} />
      <TestimonialsSection testimonials={testimonials} />
      <CtaSection />
    </div>
  );
};

export default LandingPage;

