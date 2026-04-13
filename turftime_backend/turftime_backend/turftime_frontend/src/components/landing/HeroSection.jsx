import { Link } from 'react-router-dom';
import HeroBg from '../../assets/images/landing.avif';

const HeroSection = () => {
  return (
    <section className="relative h-[92vh] min-h-140 flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src={HeroBg}
        alt="Sports action"
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
      />
      {/* Dark green overlay */}
      <div className="absolute inset-0 bg-primary-900/75" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-8 max-w-3xl mx-auto">
        <h1 className="text-6xl sm:text-7xl font-extrabold leading-tight mb-6 drop-shadow-lg">
          Book Your Game,<br />Play Your Best
        </h1>
        <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-xl mx-auto">
          Find and book sports venues near you. Connect with teams and enjoy your favorite sports hassle-free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/venues"
            className="px-6 py-3 rounded-lg font-semibold bg-white text-primary-800 hover:bg-primary-100 hover:text-primary-900 transition-all duration-200 text-center"
          >
            Find Venues
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 rounded-lg font-semibold bg-white text-primary-800 hover:bg-primary-100 hover:text-primary-900 transition-all duration-200 text-center"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white/10 to-transparent" />
    </section>
  );
};

export default HeroSection;

