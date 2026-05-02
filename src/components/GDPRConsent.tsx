import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { ShieldCheck, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export const GDPRConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show if there is no consent yet and we haven't dismissed it this session
    if (!storage.hasGDPRConsent() && !sessionStorage.getItem('gdprDismissed')) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    storage.setGDPRConsent(true);
    setShow(false);
    // Reload to apply storage properly across contexts if needed
    window.location.reload();
  };

  const handleDecline = () => {
    sessionStorage.setItem('gdprDismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom duration-500 font-['Outfit']">
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 border-4 border-slate-800">
        <div className="flex-1 flex gap-4 items-start md:items-center">
          <div className="bg-blue-500/20 p-3 rounded-xl hidden sm:block">
            <ShieldCheck className="text-blue-400 w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">
              <FormattedMessage id="gdpr.title" defaultMessage="We Value Your Privacy" />
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              <FormattedMessage id="gdpr.desc" defaultMessage="ClassRex uses your browser's local storage to save your settings, class lists, and custom tools directly on your device. We do not use cookies for tracking or send any data to our servers. Do you accept the use of local storage?" />
            </p>
          </div>
        </div>
        
        <div className="flex w-full md:w-auto gap-3 shrink-0">
          <button 
            onClick={handleDecline}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <FormattedMessage id="gdpr.decline" defaultMessage="Decline" />
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg shadow-blue-500/25"
          >
            <FormattedMessage id="gdpr.accept" defaultMessage="Accept Storage" />
          </button>
          <button 
            onClick={handleDecline}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors hidden md:block"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

