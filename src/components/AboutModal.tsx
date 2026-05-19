import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Zap, Heart } from 'lucide-react';
import logo from '../assets/ClassRex_logo.png';
import { FormattedMessage } from 'react-intl';

export const AboutModal = ({ onClose }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(() => (window as any).deferredPrompt);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if running as standalone app
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!standalone);
    };
    checkStandalone();

    // Listen for custom installation events
    const handleInstallable = (e: any) => {
      setInstallPrompt(e.detail || (window as any).deferredPrompt);
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsStandalone(true);
      (window as any).deferredPrompt = null;
      setInstallPrompt(null);
    }
  };

  const getPlatformDetails = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isMac = /macintosh|mac os x/.test(ua);
    const isWindows = /windows|win32/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|android/.test(ua);

    if (isIOS) {
      return {
        id: 'pwa.install.guide.ios',
        defaultMessage: 'To install on iOS, tap the Share button 📤 in Safari, scroll down and select "Add to Home Screen" ➕.'
      };
    }
    if (isAndroid) {
      return {
        id: 'pwa.install.guide.android',
        defaultMessage: 'To install on Android, tap the menu button ┇ next to the address bar, then select "Install app" or "Add to Home screen".'
      };
    }
    if (isMac) {
      if (isSafari) {
        return {
          id: 'pwa.install.guide.mac.safari',
          defaultMessage: 'To install on macOS Safari, open the File menu in the top bar, then select "Add to Dock..." 📥.'
        };
      }
      return {
        id: 'pwa.install.guide.mac.other',
        defaultMessage: 'To install on macOS, click the Install icon 🖥️ (down arrow) in the address bar or choose "Install ClassRex" from the browser menu.'
      };
    }
    if (isWindows) {
      return {
        id: 'pwa.install.guide.windows',
        defaultMessage: 'To install on Windows, click the Install icon 🖥️ (down arrow) in the address bar or choose "Install ClassRex" from the browser menu.'
      };
    }

    return {
      id: 'pwa.install.guide.fallback',
      defaultMessage: 'To install, open your browser menu (three dots or share icon) and select "Add to Home Screen" or click "Install" in the address bar.'
    };
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 sm:p-8 font-['Outfit'] animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white border-4 border-white rounded-[3rem] w-full h-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300 p-6 sm:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 bg-transparent">
          <div className="flex items-center gap-4">
            <img src={logo} alt="ClassRex" className="h-12 w-auto object-contain" />
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              <FormattedMessage id="about.title" defaultMessage="About ClassRex" />
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-2xl transition-all active:scale-90"
            title="Close"
          >
            <span className="text-xl">❌</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-8 space-y-8 custom-scrollbar text-slate-600 bg-transparent">
          {/* PWA Installation Section */}
          {isStandalone ? (
            <div className="p-5 rounded-[2rem] bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-between gap-4 max-w-3xl">
              <div className="space-y-1">
                <div className="font-black text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>✨</span> <FormattedMessage id="pwa.standalone.title" defaultMessage="App Mode Active" />
                </div>
                <p className="font-medium text-xs text-emerald-700/80 leading-relaxed">
                  <FormattedMessage id="pwa.standalone.desc" defaultMessage="ClassRex is running as a standalone app! Enjoy 100% offline access, zero load times, and absolute privacy." />
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 font-bold text-sm">
                ✓
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-3xl">
              <div className="space-y-2">
                <div className="font-black text-indigo-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>📱</span> <FormattedMessage id="pwa.install.title" defaultMessage="Install ClassRex App" />
                </div>
                <p className="font-medium text-sm text-slate-700 leading-snug">
                  <FormattedMessage id="pwa.install.tagline" defaultMessage="Run 100% locally and offline in your classroom!" />
                </p>
                <p className="font-medium text-xs text-slate-500 max-w-xl leading-relaxed">
                  <FormattedMessage id="pwa.install.desc" defaultMessage="Installing as an app ensures ClassRex works perfectly even without internet access. All your customized tools, lists, and history remain 100% secure and local to this device." />
                </p>
              </div>
              <div className="shrink-0 flex items-center">
                {installPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>⚡</span> <FormattedMessage id="pwa.install.button" defaultMessage="Install App" />
                  </button>
                ) : (
                  <div className="bg-slate-100/80 rounded-2xl p-3 text-[10px] font-bold text-slate-500 leading-normal max-w-xs border border-slate-200/50">
                    💡 <FormattedMessage {...getPlatformDetails()} />
                  </div>
                )}
              </div>
            </div>
          )}
          <section className="space-y-3">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>🛡️</span>
              <FormattedMessage id="about.privacy.title" defaultMessage="100% Privacy by Design" />
            </h3>
            <p className="font-medium text-base leading-relaxed text-slate-500 max-w-3xl">
              <FormattedMessage 
                id="about.privacy.desc" 
                defaultMessage="ClassRex is built with a 'Privacy First' philosophy. Unlike many modern web apps, we don't use cookies, trackers, or cloud databases. Everything you create—from student lists to customized tools—stays exclusively on your device's <b>Local Storage</b>."
                values={{ b: (chunks: React.ReactNode) => <b className="text-slate-800 font-bold">{chunks}</b> }}
              />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-3xl">
              <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
                <div className="font-black text-green-700 text-xs mb-1 uppercase tracking-wider">
                  <FormattedMessage id="about.privacy.storage" defaultMessage="Storage" />
                </div>
                <div className="font-bold text-slate-700 text-base">
                  <FormattedMessage id="about.privacy.storage.value" defaultMessage="100% Local" />
                </div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                <div className="font-black text-blue-700 text-xs mb-1 uppercase tracking-wider">
                  <FormattedMessage id="about.privacy.cookies" defaultMessage="Cookies" />
                </div>
                <div className="font-bold text-slate-700 text-base">
                  <FormattedMessage id="about.privacy.cookies.value" defaultMessage="None Used" />
                </div>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                <div className="font-black text-purple-700 text-xs mb-1 uppercase tracking-wider">
                  <FormattedMessage id="about.privacy.cloud" defaultMessage="Cloud" />
                </div>
                <div className="font-bold text-slate-700 text-base">
                  <FormattedMessage id="about.privacy.cloud.value" defaultMessage="No Access" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>⚡</span>
              <FormattedMessage id="about.speed.title" defaultMessage="Fast, Reliable & Offline" />
            </h3>
            <p className="font-medium text-base leading-relaxed text-slate-500 max-w-3xl">
              <FormattedMessage id="about.speed.desc" defaultMessage="Because no data is sent to a server, ClassRex is lightning fast. It works 100% offline once loaded, ensuring your classroom flow is never interrupted by poor connectivity." />
            </p>
            <p className="font-medium text-sm leading-relaxed italic text-slate-600 bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50 max-w-3xl">
              <FormattedMessage id="about.speed.dino" defaultMessage="ClassRex is an homage to the resilience of the Chrome Dino—providing a reliable experience even when there is no internet access. Just like the Dino keeps going, so does your classroom!" />
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>❤️</span>
              <FormattedMessage id="about.teachers.title" defaultMessage="Built for Teachers" />
            </h3>
            <p className="font-medium text-base leading-relaxed text-slate-500 max-w-3xl">
              <FormattedMessage id="about.teachers.desc" defaultMessage="ClassRex is a collection of high-fidelity interactive tools designed to make classroom management and teaching more engaging. From Random Name Pickers to Science Simulations, every tool is crafted for the modern classroom." />
            </p>
          </section>

          <section className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100/50 space-y-4 max-w-3xl">
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
              className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black hover:bg-amber-600 transition-all active:scale-95"
            >
              <FormattedMessage id="about.support.button" defaultMessage="Support on Patreon" />
            </a>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 bg-transparent">
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
