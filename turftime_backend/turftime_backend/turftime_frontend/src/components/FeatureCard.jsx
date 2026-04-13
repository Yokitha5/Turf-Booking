const FeatureCard = ({ Icon, title, description }) => {
  const IconComponent = Icon;
  return (
    <div className="bg-white/85 border border-primary-50 p-8 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary-900/15 transition text-center backdrop-blur">
      <div className="flex justify-center mb-4">
        <IconComponent className="w-12 h-12 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default FeatureCard;

