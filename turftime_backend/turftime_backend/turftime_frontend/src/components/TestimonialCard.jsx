import { Star } from 'lucide-react';

const TestimonialCard = ({ name, role, comment, rating }) => {
  return (
    <div className="bg-white/85 border border-primary-50 p-8 rounded-xl shadow-md backdrop-blur">
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-600 mb-6 italic">"{comment}"</p>
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  );
};

export default TestimonialCard;

