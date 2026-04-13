import { Link } from 'react-router-dom';

const CtaSection = () => {
  return (
    <section className="py-20 bg-linear-to-r from-primary-700 to-primary-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl mb-8 text-primary-100">
          Join thousands of sports enthusiasts and venue owners on TurfTime
        </p>
        <div className="flex justify-center">
          <Link to="/register" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
            Sign Up Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;

