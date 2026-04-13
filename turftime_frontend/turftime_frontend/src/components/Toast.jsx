import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={18} className="text-green-600" />,
  error:   <XCircle size={18} className="text-red-600" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info:    <Info size={18} className="text-blue-500" />,
};

const bg = {
  success: 'bg-green-50 border-green-200',
  error:   'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info:    'bg-blue-50 border-blue-200',
};

const text = {
  success: 'text-green-800',
  error:   'text-red-800',
  warning: 'text-amber-800',
  info:    'text-blue-800',
};

/**
 * Usage:
 *   const [toast, setToast] = useState(null);
 *   const showToast = (message, type = 'success') => {
 *     setToast({ message, type });
 *     setTimeout(() => setToast(null), 3500);
 *   };
 *   <Toast toast={toast} onClose={() => setToast(null)} />
 */
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'success';

  return (
    <div className="fixed bottom-6 right-6 z-9999 animate-fade-in">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${bg[type]}`}>
        <span className="mt-0.5 shrink-0">{icons[type]}</span>
        <p className={`text-sm font-medium leading-snug flex-1 ${text[type]}`}>{toast.message}</p>
        <button onClick={onClose} className="shrink-0 ml-1 mt-0.5 opacity-60 hover:opacity-100 transition">
          <X size={14} className={text[type]} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
