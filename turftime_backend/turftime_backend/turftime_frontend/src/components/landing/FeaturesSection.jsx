import FeatureCard from '../../components/FeatureCard.jsx';

const FeaturesSection = ({ features }) => {
  return (
    <section className="py-20 bg-primary-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose TurfTime?</h2>
          <p className="text-xl text-gray-600">Everything you need to book and enjoy your favorite sports</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map(({ Icon, title, description }, index) => (
            <FeatureCard key={index} Icon={Icon} title={title} description={description} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

