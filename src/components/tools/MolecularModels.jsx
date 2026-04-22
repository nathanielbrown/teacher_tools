import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { 
  Share2, RotateCcw, Trash2, Plus, Info, 
  Settings2, Download, Layers, Box, HelpCircle,
  Shapes, Zap, Beaker
} from 'lucide-react';

// CPK Coloring & Valence Rules
const ATOM_TYPES = [
  { id: 'C', name: 'Carbon', color: '#1a1a1a', textColor: '#fff', valence: 4, radius: 24, glow: 'rgba(0,0,0,0.3)' },
  { id: 'H', name: 'Hydrogen', color: '#f8fafc', textColor: '#475569', valence: 1, radius: 18, glow: 'rgba(255,255,255,0.5)' },
  { id: 'O', name: 'Oxygen', color: '#ef4444', textColor: '#fff', valence: 2, radius: 22, glow: 'rgba(239,68,68,0.3)' },
  { id: 'N', name: 'Nitrogen', color: '#3b82f6', textColor: '#fff', valence: 3, radius: 22, glow: 'rgba(59,130,246,0.3)' },
  { id: 'Cl', name: 'Chlorine', color: '#22c55e', textColor: '#fff', valence: 1, radius: 26, glow: 'rgba(34,197,94,0.3)' },
];

const PRESETS = [
  { 
    name: 'Water (H₂O)', 
    atoms: [
      { id: 'o1', type: 'O', x: 400, y: 300 },
      { id: 'h1', type: 'H', x: 340, y: 360 },
      { id: 'h2', type: 'H', x: 460, y: 360 },
    ],
    bonds: [
      { id: 'b1', a1: 'o1', a2: 'h1', order: 1 },
      { id: 'b2', a1: 'o1', a2: 'h2', order: 1 },
    ]
  },
  { 
    name: 'Carbon Dioxide (CO₂)', 
    atoms: [
      { id: 'c1', type: 'C', x: 400, y: 300 },
      { id: 'o1', type: 'O', x: 300, y: 300 },
      { id: 'o2', type: 'O', x: 500, y: 300 },
    ],
    bonds: [
      { id: 'b1', a1: 'c1', a2: 'o1', order: 2 },
      { id: 'b2', a1: 'c1', a2: 'o2', order: 2 },
    ]
  },
  {
    name: 'Methane (CH₄)',
    atoms: [
      { id: 'c1', type: 'C', x: 400, y: 300 },
      { id: 'h1', type: 'H', x: 400, y: 220 },
      { id: 'h2', type: 'H', x: 400, y: 380 },
      { id: 'h3', type: 'H', x: 320, y: 300 },
      { id: 'h4', type: 'H', x: 480, y: 300 },
    ],
    bonds: [
      { id: 'b1', a1: 'c1', a2: 'h1', order: 1 },
      { id: 'b2', a1: 'c1', a2: 'h2', order: 1 },
      { id: 'b3', a1: 'c1', a2: 'h3', order: 1 },
      { id: 'b4', a1: 'c1', a2: 'h4', order: 1 },
    ]
  }
];

export const MolecularModels = () => {
  const [atoms, setAtoms] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [activeAtom, setActiveAtom] = useState(null); // ID of atom being dragged or bonded from
  const [bondingFrom, setBondingFrom] = useState(null); // { id, x, y }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const getAtomConfig = (type) => ATOM_TYPES.find(t => t.id === type);

  const getAtomBonds = (atomId) => {
    return bonds.reduce((total, bond) => {
      if (bond.a1 === atomId || bond.a2 === atomId) {
        return total + bond.order;
      }
      return total;
    }, 0);
  };

  const addAtom = (type, x = 100, y = 100) => {
    const id = `atom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setAtoms([...atoms, { id, type, x, y }]);
  };

  const handleDrag = (id, info) => {
    setAtoms(prev => prev.map(a => 
      a.id === id ? { ...a, x: a.x + info.delta.x, y: a.y + info.delta.y } : a
    ));
  };

  const startBonding = (atom, e) => {
    e.stopPropagation();
    const config = getAtomConfig(atom.type);
    if (getAtomBonds(atom.id) >= config.valence) return;
    setBondingFrom({ id: atom.id, x: atom.x, y: atom.y });
  };

  const completeBonding = (targetAtom) => {
    if (!bondingFrom || bondingFrom.id === targetAtom.id) {
      setBondingFrom(null);
      return;
    }

    const configSource = getAtomConfig(atoms.find(a => a.id === bondingFrom.id).type);
    const configTarget = getAtomConfig(targetAtom.type);

    // Check if both atoms can accept more bonds
    if (getAtomBonds(bondingFrom.id) >= configSource.valence || 
        getAtomBonds(targetAtom.id) >= configTarget.valence) {
      setBondingFrom(null);
      return;
    }

    // Check if bond already exists
    const existingBondIndex = bonds.findIndex(b => 
      (b.a1 === bondingFrom.id && b.a2 === targetAtom.id) || 
      (b.a1 === targetAtom.id && b.a2 === bondingFrom.id)
    );

    if (existingBondIndex > -1) {
      // Increment bond order if valence allows
      setBonds(prev => prev.map((b, i) => {
        if (i === existingBondIndex) {
          const newOrder = Math.min(3, b.order + 1);
          // Re-check valence for the potential new order
          if (getAtomBonds(b.a1) - b.order + newOrder <= getAtomConfig(atoms.find(a => a.id === b.a1).type).valence &&
              getAtomBonds(b.a2) - b.order + newOrder <= getAtomConfig(atoms.find(a => a.id === b.a2).type).valence) {
            return { ...b, order: newOrder };
          }
        }
        return b;
      }));
    } else {
      setBonds([...bonds, { 
        id: `bond_${Date.now()}`, 
        a1: bondingFrom.id, 
        a2: targetAtom.id, 
        order: 1 
      }]);
    }
    setBondingFrom(null);
  };

  const removeAtom = (id) => {
    setAtoms(prev => prev.filter(a => a.id !== id));
    setBonds(prev => prev.filter(b => b.a1 !== id && b.a2 !== id));
  };

  const removeBond = (id) => {
    setBonds(prev => prev.filter(b => b.id !== id));
  };

  const loadPreset = (preset) => {
    setAtoms(preset.atoms.map(a => ({ ...a, id: `${a.id}_${Date.now()}` })));
    // Need to map bond IDs to new atom IDs
    const idMap = preset.atoms.reduce((acc, a, i) => {
      acc[preset.atoms[i].id] = `${a.id}_${Date.now()}`;
      return acc;
    }, {});
    setBonds(preset.bonds.map(b => ({ ...b, id: `${b.id}_${Date.now()}`, a1: idMap[b.a1], a2: idMap[b.a2] })));
  };

  const resetWorkspace = () => {
    setAtoms([]);
    setBonds([]);
    setBondingFrom(null);
  };

  // Track mouse for bonding line
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto min-h-0 h-full flex flex-col gap-4 px-6 py-6 select-none overflow-y-auto lg:overflow-hidden bg-slate-50/30">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Share2 size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Molecular Models</h2>
            <p className="text-slate-400 font-medium italic">Build complex structures with atoms and bonds.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
            {PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => loadPreset(p)}
                className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-xs font-black text-slate-600 uppercase tracking-widest active:scale-95"
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
          
          <button
            onClick={resetWorkspace}
            className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 shadow-md"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Workspace */}
        <div 
          ref={containerRef}
          className="lg:col-span-9 bg-white rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden relative shadow-indigo-900/5 group cursor-crosshair"
          onClick={() => setBondingFrom(null)}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[#f8fafc] opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          {/* Bonds Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {/* Active Bonding Line */}
            {bondingFrom && (
              <line 
                x1={bondingFrom.x} y1={bondingFrom.y} 
                x2={mousePos.x} y2={mousePos.y} 
                stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}
            
            {/* Real Bonds */}
            {bonds.map(bond => {
              const a1 = atoms.find(a => a.id === bond.a1);
              const a2 = atoms.find(a => a.id === bond.a2);
              if (!a1 || !a2) return null;

              const dx = a2.x - a1.x;
              const dy = a2.y - a1.y;
              const angle = Math.atan2(dy, dx);
              
              const offset = 6;
              
              return (
                <g key={bond.id} className="cursor-pointer pointer-events-auto group/bond" onClick={(e) => { e.stopPropagation(); removeBond(bond.id); }}>
                  {bond.order === 1 && (
                    <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
                  )}
                  {bond.order === 2 && (
                    <>
                      <line x1={a1.x + Math.sin(angle) * offset} y1={a1.y - Math.cos(angle) * offset} x2={a2.x + Math.sin(angle) * offset} y2={a2.y - Math.cos(angle) * offset} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
                      <line x1={a1.x - Math.sin(angle) * offset} y1={a1.y + Math.cos(angle) * offset} x2={a2.x - Math.sin(angle) * offset} y2={a2.y + Math.cos(angle) * offset} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
                    </>
                  )}
                  {bond.order === 3 && (
                    <>
                      <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
                      <line x1={a1.x + Math.sin(angle) * offset * 1.5} y1={a1.y - Math.cos(angle) * offset * 1.5} x2={a2.x + Math.sin(angle) * offset * 1.5} y2={a2.y - Math.cos(angle) * offset * 1.5} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                      <line x1={a1.x - Math.sin(angle) * offset * 1.5} y1={a1.y + Math.cos(angle) * offset * 1.5} x2={a2.x - Math.sin(angle) * offset * 1.5} y2={a2.y + Math.cos(angle) * offset * 1.5} stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                    </>
                  )}
                  {/* Hover Hitbox & Tooltip */}
                  <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke="transparent" strokeWidth="20" />
                  <title>Click to remove bond</title>
                </g>
              );
            })}
          </svg>

          {/* Atoms Layer */}
          <div className="absolute inset-0 z-20 overflow-hidden">
            <AnimatePresence>
              {atoms.map(atom => {
                const config = getAtomConfig(atom.type);
                const isFull = getAtomBonds(atom.id) >= config.valence;
                
                return (
                  <motion.div
                    key={atom.id}
                    drag
                    dragMomentum={false}
                    onDrag={(e, info) => handleDrag(atom.id, info)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{ 
                      x: atom.x - config.radius, 
                      y: atom.y - config.radius,
                      width: config.radius * 2,
                      height: config.radius * 2,
                    }}
                    className="absolute cursor-grab active:cursor-grabbing group/atom"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bondingFrom) completeBonding(atom);
                    }}
                  >
                    {/* Atom Sphere */}
                    <div 
                      className="w-full h-full rounded-full shadow-lg relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                      style={{ 
                        backgroundColor: config.color,
                        boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.4), 0 10px 20px ${config.glow}`,
                      }}
                    >
                      <span 
                        className="font-black text-sm pointer-events-none"
                        style={{ color: config.textColor }}
                      >
                        {atom.type}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAtom(atom.id); }}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover/atom:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Bond Connector Button */}
                      {!isFull && (
                        <button
                          onMouseDown={(e) => startBonding(atom, e)}
                          className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-full p-1.5 shadow-lg opacity-0 group-hover/atom:opacity-100 transition-opacity text-white hover:bg-indigo-700 active:scale-90"
                        >
                          <Plus size={14} />
                        </button>
                      )}

                      {/* Valence Indicators */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-40">
                        {Array.from({ length: config.valence }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full ${i < getAtomBonds(atom.id) ? 'bg-indigo-500' : 'bg-slate-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Empty State Help */}
          {atoms.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-300 pointer-events-none">
              <Shapes size={80} className="opacity-20" />
              <p className="text-xl font-black uppercase tracking-[0.3em] opacity-40">Drag atoms to begin</p>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Atom Palette */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Zap className="text-indigo-600" />
              Atom Palette
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {ATOM_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => addAtom(type.id, 200 + Math.random() * 400, 200 + Math.random() * 200)}
                  className="group relative flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-[2rem] hover:bg-indigo-50 transition-all border-2 border-transparent hover:border-indigo-100 active:scale-95"
                >
                  <div 
                    className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden"
                    style={{ 
                      backgroundColor: type.color,
                      boxShadow: `inset -4px -4px 8px rgba(0,0,0,0.3)`
                    }}
                  >
                     <span className="font-black text-xs" style={{ color: type.textColor }}>{type.id}</span>
                     <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{type.name}</span>
                  <div className="absolute -top-1 -right-1 bg-white px-1.5 py-0.5 rounded-full text-[8px] font-black text-slate-400 border border-slate-100">
                    V{type.valence}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-indigo-950 rounded-[2.5rem] p-8 shadow-xl border border-indigo-900 flex-1 flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 group-hover:scale-110 transition-transform">
               <Beaker size={200} className="text-white" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Info className="text-indigo-300" size={20} />
                </div>
                <h3 className="text-white text-xl font-black tracking-tight">Bonding Rules</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/10">
                  <h4 className="text-indigo-300 font-black text-[10px] uppercase tracking-widest mb-1">Creating Bonds</h4>
                  <p className="text-[11px] text-indigo-100/60 leading-relaxed">
                    Hover an atom and click the <span className="text-indigo-400">+</span> icon, then click another atom to connect them.
                  </p>
                </div>

                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/10">
                  <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1">Multi-Bonds</h4>
                  <p className="text-[11px] text-indigo-100/60 leading-relaxed">
                    Repeat the bonding process between the same two atoms to create double or triple bonds.
                  </p>
                </div>

                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/10">
                  <h4 className="text-red-400 font-black text-[10px] uppercase tracking-widest mb-1">Valence</h4>
                  <p className="text-[11px] text-indigo-100/60 leading-relaxed">
                    Each atom has a maximum bond limit (Valence). Look at the dots above the atom to see its current capacity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -16;
          }
        }
      `}</style>
    </div>
  );
};
