import React from 'react';
import { X, ShieldCheck, Zap, Heart } from 'lucide-react';
import logo from '../assets/ClassRex_logo.png';
import { FormattedMessage } from 'react-intl';

export const AboutModal = ({ onClose }) => {

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Outfit']"
      onClick={onClose}
    >
      <div 
        className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <img src={logo} alt="ClassRex" className="h-10 w-auto object-contain" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              <FormattedMessage id="about.title" defaultMessage="About ClassRex" />
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-slate-600">
            <span className="text-xl">❌</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-600 bg-white">
          <section className="space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>🛡️</span>
              <FormattedMessage id="about.privacy.title" defaultMessage="100% Privacy by Design" />
            </h3>
            <p className="font-medium text-sm leading-relaxed">
              <FormattedMessage 
                id="about.privacy.desc" 
                defaultMessage="ClassRex is built with a 'Privacy First' philosophy. Unlike many modern web apps, we don't use cookies, trackers, or cloud databases. Everything you create—from student lists to customized tools—stays exclusively on your device's <b>Local Storage</b>."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
                <div className="font-black text-green-700 text-[10px] mb-1 uppercase tracking-wider">
                  <FormattedMessage id="about.privacy.storage" defaultMessage="Storage" />
                </div>
                <div className="font-bold text-slate-700 text-sm">
                  <FormattedMessage id="about.privacy.storage.value" defaultMessage="100% Local" />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                <div className="font-black text-blue-700 text-[10px] mb-1 uppercase tracking-wider">
                  <FormattedMessage id="about.privacy.cookies" defaultMessage="Cookies" />
                </div>
                <div className="font-bold text-slate-700 text-sm">
                  <FormattedMessage id="about.privacy.cookies.value" defaultMessage="None Used" />
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                <div className="font-black text-purple-700 text-[10px] mb-1 uppercase tracking-wider">
                  <FormattedMessage id="about.privacy.cloud" defaultMessage="Cloud" />
                </div>
                <div className="font-bold text-slate-700 text-sm">
                  <FormattedMessage id="about.privacy.cloud.value" defaultMessage="No Access" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>⚡</span>
              <FormattedMessage id="about.speed.title" defaultMessage="Fast, Reliable & Offline" />
            </h3>
            <p className="font-medium text-sm leading-relaxed">
              <FormattedMessage id="about.speed.desc" defaultMessage="Because no data is sent to a server, ClassRex is lightning fast. It works 100% offline once loaded, ensuring your classroom flow is never interrupted by poor connectivity." />
            </p>
            <p className="font-medium text-xs leading-relaxed italic text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <FormattedMessage id="about.speed.dino" defaultMessage="ClassRex is an homage to the resilience of the Chrome Dino—providing a reliable experience even when there is no internet access. Just like the Dino keeps going, so does your classroom!" />
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>❤️</span>
              <FormattedMessage id="about.teachers.title" defaultMessage="Built for Teachers" />
            </h3>
            <p className="font-medium text-sm leading-relaxed">
              <FormattedMessage id="about.teachers.desc" defaultMessage="ClassRex is a collection of high-fidelity interactive tools designed to make classroom management and teaching more engaging. From Random Name Pickers to Science Simulations, every tool is crafted for the modern classroom." />
            </p>
          </section>

          <section className="p-4 rounded-3xl bg-amber-50 border border-amber-100 space-y-3">
            <h3 className="text-sm font-black text-amber-800 flex items-center gap-2 uppercase tracking-wider">
              🚀 <FormattedMessage id="about.support.title" defaultMessage="Support the Project" />
            </h3>
            <p className="font-medium text-xs leading-relaxed text-amber-900/70">
              <FormattedMessage id="about.support.desc" defaultMessage="ClassRex is free to use and ad-free. If you find these tools helpful and would like to support their development, please consider becoming a patron." />
            </p>
            <a 
              href="https://www.patreon.com/cw/ClassRex/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
            >
              <FormattedMessage id="about.support.button" defaultMessage="Support on Patreon" />
            </a>
          </section>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
            <div className="flex items-center gap-4">
              <span><FormattedMessage id="about.footer.version" defaultMessage="Version" /> {import.meta.env.PACKAGE_VERSION || '1.0.0'}</span>
              <a href="/privacy" className="hover:text-slate-600 transition-colors underline">
                <FormattedMessage id="about.footer.privacy" defaultMessage="Privacy Policy" />
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <FormattedMessage id="about.footer.madeBy" defaultMessage="Made with ❤️ for Educators" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
