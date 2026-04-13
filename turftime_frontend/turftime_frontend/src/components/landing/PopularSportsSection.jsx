import SportCard from '../../components/SportCard.jsx';

const PopularSportsSection = ({ sports }) => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Sports</h2>
          <p className="text-xl text-gray-600">Explore venues for your favorite sports</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {sports.map((sport, index) => (
            <SportCard 
              key={index} 
              name={sport.name} 
              image={sport.image} 
              venues={sport.venues} 
              bgColor={sport.bgColor} 
              borderColor={sport.borderColor} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularSportsSection;

