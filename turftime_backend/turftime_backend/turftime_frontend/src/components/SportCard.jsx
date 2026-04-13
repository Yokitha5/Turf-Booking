import { Link } from 'react-router-dom';

const SportCard = ({ name, image, venues, bgColor, borderColor }) => {
  const src = image.includes('auto=format')
    ? image
    : image.replace('w=400', 'w=400&auto=format&fit=crop&q=80');

  return (
    <Link to={`/venues?sport=${name}`} className={`overflow-hidden group w-64 mx-auto rounded-xl ${bgColor}`}>
      <div className={`relative h-64 overflow-hidden rounded-xl ${bgColor}`}>
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%2316a34a"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">' +
              name +
              '</text></svg>';
          }}
        />
      </div>
    </Link>
  );
};

export default SportCard;
