import TestimonialCard from '../../components/TestimonialCard.jsx';

const TestimonialsSection = ({ testimonials }) => {
  return (
    <section className="py-20 bg-primary-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600">Don't just take our word for it</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <TestimonialCard key={index} name={t.name} role={t.role} comment={t.comment} rating={t.rating} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

