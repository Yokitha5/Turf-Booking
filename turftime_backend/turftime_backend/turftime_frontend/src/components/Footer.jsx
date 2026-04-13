import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-900 text-primary-200 border-t border-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <Mail size={14} />
              <span>harinivishani@turftime.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>HV Sports Ground, Coimbatore</span>
            </div>
          </div>
          <div className="text-xs text-primary-400">
            &copy; {new Date().getFullYear()} TurfTime
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

