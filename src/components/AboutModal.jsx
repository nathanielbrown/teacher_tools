import React from 'react';
import { X, Info, ShieldCheck, Zap, Heart } from 'lucide-react';

export const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Outfit']">
      <div className="glass-card rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-8 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Info size={28} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">About ClassRex</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100/50 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-slate-600">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-slate-600">
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-green-500" />
              100% Privacy by Design
            </h3>
            <p className="font-medium leading-relaxed">
              ClassRex is built with a "Privacy First" philosophy. Unlike many modern web apps, we don't use cookies, trackers, or cloud databases. 
              Everything you create—from student lists to customized tools—stays exclusively on your device's <strong>Local Storage</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <div className="font-black text-green-700 text-xs mb-1 uppercase tracking-wider">Storage</div>
                <div className="font-bold text-slate-700">100% Local</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="font-black text-blue-700 text-xs mb-1 uppercase tracking-wider">Cookies</div>
                <div className="font-bold text-slate-700">None Used</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="font-black text-purple-700 text-xs mb-1 uppercase tracking-wider">Cloud</div>
                <div className="font-bold text-slate-700">No Access</div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Zap className="text-yellow-500" />
              Fast & Reliable
            </h3>
            <p className="font-medium leading-relaxed">
              Because no data is sent to a server, the application is lightning fast. It works offline once loaded and ensures your classroom flow is never interrupted by poor internet connectivity.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Heart className="text-rose-500" />
              Built for Teachers
            </h3>
            <p className="font-medium leading-relaxed">
              ClassRex is a collection of high-fidelity interactive tools designed to make classroom management and teaching more engaging. From Random Name Pickers to Science Simulations, every tool is crafted for the modern classroom.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-400">
            <span>Version 1.2.0</span>
            <div className="flex items-center gap-2">
              Made with <Heart size={14} className="text-rose-500 fill-rose-500" /> for Educators
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
