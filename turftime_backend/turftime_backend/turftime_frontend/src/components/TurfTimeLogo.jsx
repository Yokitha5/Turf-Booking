import logoSrc from '../assets/images/turftime-logo.svg';

const TurfTimeLogo = ({ size = 40, className = '' }) => (
  <img
    src={logoSrc}
    width={size}
    height={size}
    className={className}
    alt="TurfTime logo"
  />
);

export default TurfTimeLogo;
