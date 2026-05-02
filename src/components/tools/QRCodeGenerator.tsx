import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, 
  QrCode
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { useHeader } from '../../contexts/HeaderContext';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { FormattedMessage } from 'react-intl';

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
      <FormattedMessage id="qrcodegenerator.help.title" />
    </h3>
    <div className="space-y-3">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex gap-3 text-left">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
            step === 1 ? 'bg-blue-50 text-blue-600' : 
            step === 2 ? 'bg-indigo-50 text-indigo-600' : 
            step === 3 ? 'bg-purple-50 text-purple-600' : 
            'bg-green-50 text-green-600'
          }`}>
            {step}
          </div>
          <p className="text-sm text-slate-600 font-medium leading-tight">
            <FormattedMessage 
              id={`qrcodegenerator.help.step${step}`} 
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
        </div>
      ))}
    </div>
  </div>
);

export const QRCodeGenerator = () => {
  const { setHasConfig, setOnConfigToggle, setHelpContent, setOnReset, clearHeader } = useHeader();
  const { settings } = useSettings();
  
  const [text, setText] = useState('https://classrex.com');
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const resetTool = useCallback(() => {
    setText('https://classrex.com');
    setFgColor('#0f172a');
    setBgColor('#ffffff');
    setIsConfigOpen(false);
    audioEngine.playTick(settings.soundTheme);
  }, [settings.soundTheme]);

  useEffect(() => {
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setOnReset(() => resetTool);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setOnReset, setHelpContent, resetTool, setHasConfig, setOnConfigToggle]);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = url;
      link.click();
      audioEngine.playTick(settings.soundTheme);
    }
  };

  return (
    <ToolPanel className="italic" baseWidth={1200} baseHeight={800}>
      <div className="w-full h-full flex flex-col gap-8 p-8 lg:p-12 overflow-y-auto custom-scrollbar">
        {/* QR Code Section - Now at Top */}
        <div className="w-full flex flex-col items-center gap-8 relative z-20">
          <div className="bg-slate-50 p-8 lg:p-12 rounded-[3rem] border-4 border-white flex flex-col items-center gap-8 relative overflow-hidden shrink-0 w-full max-w-2xl mx-auto">
             <div className="relative p-12 bg-white rounded-[2.5rem] border-4 border-white overflow-hidden flex items-center justify-center group z-10" ref={qrRef}>
                <div className="absolute inset-0 bg-white" />
                <div className="relative z-10">
                   <QRCodeCanvas
                      value={text || " "}
                      size={350}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level="H"
                      includeMargin={true}
                      className="max-w-full h-auto"
                   />
                </div>
             </div>

             <button
               onClick={handleDownload}
               disabled={!text}
               className="w-full max-w-md h-20 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 relative z-10"
             >
               <Download size={20} strokeWidth={4} /> <FormattedMessage id="qrcodegenerator.label.download" />
             </button>
          </div>

          <SettingsPanel 
            isOpen={isConfigOpen} 
            onClose={() => setIsConfigOpen(false)}
            title="Colors"
          >
            <div className="space-y-6">
              <div className="space-y-3 text-left">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-4">
                   <FormattedMessage id="qrcodegenerator.settings.code_color" />
                 </label>
                 <div className="w-full h-16 rounded-2xl border-4 border-white overflow-hidden relative cursor-pointer group/color">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => { setFgColor(e.target.value); audioEngine.playTick(settings.soundTheme); }}
                      className="absolute inset-0 w-full h-full cursor-pointer scale-[5] opacity-0"
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-8" style={{ backgroundColor: fgColor }}>
                       <span className="text-[10px] font-black uppercase mix-blend-difference text-white">{fgColor}</span>
                       <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                    </div>
                 </div>
              </div>

              <div className="space-y-3 text-left">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-4">
                   <FormattedMessage id="qrcodegenerator.settings.bg_color" />
                 </label>
                 <div className="w-full h-16 rounded-2xl border-4 border-white overflow-hidden relative cursor-pointer group/color">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => { setBgColor(e.target.value); audioEngine.playTick(settings.soundTheme); }}
                      className="absolute inset-0 w-full h-full cursor-pointer scale-[5] opacity-0"
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-8" style={{ backgroundColor: bgColor }}>
                       <span className="text-[10px] font-black uppercase mix-blend-difference text-white">{bgColor}</span>
                       <div className="w-6 h-6 rounded-full border-2 border-white/50" />
                    </div>
                 </div>
              </div>
            </div>
          </SettingsPanel>
        </div>

        {/* URL Entry Section - Now at Bottom */}
        <div className="w-full bg-white/50 rounded-[3rem] border-4 border-white flex flex-col relative overflow-hidden group min-h-[300px]">
          <div className="flex-1 p-8 lg:p-12 flex flex-col gap-8 relative z-10">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                   <QrCode size={24} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none text-left">
                    <FormattedMessage id="qrcodegenerator.title" />
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 text-left">
                    <FormattedMessage id="qrcodegenerator.subtitle" />
                  </p>
                </div>
             </div>

             <textarea
               value={text}
               onChange={(e) => { setText(e.target.value); audioEngine.playTick(settings.soundTheme); }}
               placeholder="Type here..."
               className="flex-1 w-full p-8 lg:p-12 rounded-[2.5rem] border-4 border-white bg-white/50 focus:bg-white transition-all resize-none text-2xl font-black text-slate-900 outline-none placeholder:text-slate-200 italic custom-scrollbar"
             />
          </div>
        </div>
      </div>
    </ToolPanel>
  );
};

export default QRCodeGenerator;
