import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, Trash2, RotateCcw, Shuffle, Monitor, Square, Circle, Plus, X,
  DoorOpen, AppWindow, TreePine, Presentation, ChevronRight, MousePointer2, Check, UserPlus, UserMinus, Layout as LayoutIcon, Activity
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { motion, AnimatePresence } from 'framer-motion';

// 1. Constants
const FURNITURE_TYPES = [
  { id: 'desk-single', name: 'Single Desk', icon: Square, seats: 1, w: 80, h: 60, type: 'rect' },
  { id: 'table-double', name: 'Double Table', icon: Square, seats: 2, w: 140, h: 60, type: 'rect' },
  { id: 'table-quad', name: 'Quad Table', icon: Square, seats: 4, w: 140, h: 100, type: 'rect' },
  { id: 'table-round', name: 'Round Table', icon: Circle, seats: 4, w: 100, h: 100, type: 'circle' },
  { id: 'teacher-desk', name: 'Teacher Desk', icon: Monitor, seats: 0, w: 160, h: 80, type: 'teacher' },
  { id: 'door', name: 'Entrance', icon: DoorOpen, seats: 0, w: 100, h: 20, type: 'door' },
  { id: 'window', name: 'Window', icon: AppWindow, seats: 0, w: 120, h: 20, type: 'window' },
  { id: 'plant', name: 'Flora', icon: TreePine, seats: 0, w: 60, h: 60, type: 'plant' },
  { id: 'smart-board', name: 'Display', icon: Presentation, seats: 0, w: 200, h: 20, type: 'smart-board' },
];

const generatePresets = (studentCount: number) => {
  const traditionalItems = [
    { id: 'door1', typeId: 'door', x: -30, y: 250, rotation: 90, assignments: {} },
    { id: 't1', typeId: 'teacher-desk', x: 300, y: 50, assignments: {} }
  ];
  const cols = Math.ceil(Math.sqrt(studentCount));
  const rows = Math.ceil(studentCount / cols);
  let count = 0;
  for(let r=0; r<rows; r++) {
    for(let c=0; c<cols; c++) {
      if(count >= studentCount) break;
      traditionalItems.push({
        id: `d${count}`,
        typeId: 'desk-single',
        x: 100 + c * 100,
        y: 200 + r * 80,
        assignments: {}
      });
      count++;
    }
  }

  const numClusters = Math.ceil(studentCount / 4);
  const clusterCols = Math.ceil(Math.sqrt(numClusters));
  const clusterRows = Math.ceil(numClusters / clusterCols);
  const clusterItems = [
    { id: 'door1', typeId: 'door', x: -30, y: 250, rotation: 90, assignments: {} },
    { id: 't1', typeId: 'teacher-desk', x: 300, y: 50, assignments: {} }
  ];
  count = 0;
  for(let r=0; r<clusterRows; r++) {
    for(let c=0; c<clusterCols; c++) {
      if(count >= numClusters) break;
      clusterItems.push({
        id: `c${count}`,
        typeId: 'table-quad',
        x: 100 + c * 200,
        y: 200 + r * 150,
        assignments: {}
      });
      count++;
    }
  }

  const numDouble = Math.ceil(studentCount / 2);
  const bottomCount = Math.min(8, numDouble);
  const sideCount = numDouble - bottomCount;
  const leftCount = Math.ceil(sideCount / 2);
  const rightCount = Math.floor(sideCount / 2);
  
  const uShapeItems = [
    { id: 'door1', typeId: 'door', x: -30, y: 250, rotation: 90, assignments: {} },
    { id: 't1', typeId: 'teacher-desk', x: 350, y: 50, assignments: {} }
  ];
  
  const xOffset = 60;
  const rightX = 660; 
  const yOffset = 150;
  const stepY = 145;

  for(let i=0; i<leftCount; i++) {
    uShapeItems.push({
      id: `u-l${i}`,
      typeId: 'table-double',
      x: xOffset,
      y: yOffset + i * stepY,
      assignments: {},
      rotation: 90
    });
  }

  const bottomY = yOffset + Math.max(0, leftCount - 1) * stepY + 120;
  const bottomStartX = xOffset + 100;
  const bottomEndX = rightX - 100;
  const stepX = bottomCount > 1 ? (bottomEndX - bottomStartX) / (bottomCount - 1) : 0;
  
  for(let i=0; i<bottomCount; i++) {
    uShapeItems.push({
      id: `u-b${i}`,
      typeId: 'table-double',
      x: bottomStartX + i * stepX,
      y: bottomY,
      assignments: {},
      rotation: 0
    });
  }

  for(let i=0; i<rightCount; i++) {
    uShapeItems.push({
      id: `u-r${i}`,
      typeId: 'table-double',
      x: rightX,
      y: yOffset + i * stepY,
      assignments: {},
      rotation: 270
    });
  }

  return {
    traditional: { name: 'Structured Rows', items: traditionalItems },
    clusters: { name: 'Collaborative Groups', items: clusterItems },
    ushape: { name: 'U-Shape Seminar', items: uShapeItems }
  };
};

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Seating Plan Designer</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Use the <b>Design Console</b> to switch between layouts, furniture, and student lists.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Drag students from the <b>Students</b> tab directly onto seats in the blueprint.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Click on furniture to <b>rotate</b> or <b>remove</b> it from the plan.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Switch classes in the header to manage different seating arrangements.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None, handled in component)

// 5. Classes (None)

// 6. Functions (None)

// 7. Component
export const SeatingPlanGenerator = () => {
  const { settings } = useSettings();
  const { setHeaderActions, setHelpContent, setOnReset, clearHeader, isConfigOpen, setIsConfigOpen, setHasConfig, setOnConfigToggle } = useHeader();
  
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [planItems, setPlanItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [layoutStudentCount, setLayoutStudentCount] = useState(28);
  
  const [activeTab, setActiveTab] = useState('layouts'); // 'layouts', 'furniture', 'students'
  const constraintsRef = useRef(null);
  const dragOffsetRef = useRef({ itemX: 0, itemY: 0 });

  const selectedClass = settings.classes.find(c => c.id === selectedClassId);
  const students = selectedClass ? selectedClass.students : [];

  useEffect(() => {
    if (!selectedClassId) return;
    const savedPlans = JSON.parse(storage.getItem('teacher_tools_seating_plans') || '{}');
    if (savedPlans[selectedClassId]) {
      setPlanItems(savedPlans[selectedClassId]);
    } else {
      setPlanItems(generatePresets(layoutStudentCount).traditional.items);
    }
  }, [selectedClassId, layoutStudentCount]);

  const savePlan = useCallback((items: any[]) => {
    if (!selectedClassId) return;
    const savedPlans = JSON.parse(storage.getItem('teacher_tools_seating_plans') || '{}');
    savedPlans[selectedClassId] = items;
    storage.setItem('teacher_tools_seating_plans', JSON.stringify(savedPlans));
  }, [selectedClassId]);

  const clearAssignments = useCallback(() => {
    const updated = planItems.map(item => ({ ...item, assignments: {} }));
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  }, [planItems, savePlan, settings.soundTheme]);

  useEffect(() => {
    setOnReset(() => clearAssignments);
    setHelpContent(HELP_INFO);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setHasConfig(true);
    return () => clearHeader();
  }, [clearHeader, setOnReset, clearAssignments, setHelpContent, setOnConfigToggle, setHasConfig, setIsConfigOpen]);

  const addItem = (typeId: string) => {
    const newItem = {
      id: `item-${Date.now()}`,
      typeId,
      x: 350,
      y: 250,
      assignments: {},
      rotation: 0
    };
    const updated = [...planItems, newItem];
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const updateItemPos = (id: string, x: number, y: number) => {
    const updated = planItems.map(item => item.id === id ? { ...item, x, y } : item);
    setPlanItems(updated);
    savePlan(updated);
  };

  const removeItem = (id: string) => {
    const updated = planItems.filter(item => item.id !== id);
    setPlanItems(updated);
    setSelectedItem(null);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const rotateItem = (id: string) => {
    const updated = planItems.map(item => 
      item.id === id ? { ...item, rotation: ((item.rotation || 0) + 90) % 360 } : item
    );
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const assignStudent = (itemId: string, seatIndex: number, studentName: string) => {
    const updated = planItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          assignments: {
            ...item.assignments,
            [seatIndex]: studentName
          }
        };
      }
      const newAssignments = { ...item.assignments };
      Object.keys(newAssignments).forEach(key => {
        if (newAssignments[key] === studentName) {
          delete newAssignments[key];
        }
      });
      return { ...item, assignments: newAssignments };
    });
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const unassignSeat = (itemId: string, seatIndex: number) => {
    const updated = planItems.map(item => {
      if (item.id === itemId) {
        const newAssignments = { ...item.assignments };
        delete newAssignments[seatIndex];
        return { ...item, assignments: newAssignments };
      }
      return item;
    });
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const randomiseSeating = () => {
    const assignedStudents = new Set();
    planItems.forEach(item => {
      Object.values(item.assignments).forEach(name => assignedStudents.add(name));
    });

    const unassignedStudents = students.filter(s => !assignedStudents.has(s)).sort(() => Math.random() - 0.5);
    let studentIndex = 0;

    const updated = planItems.map(item => {
      const type = FURNITURE_TYPES.find(t => t.id === item.typeId);
      if (!type || type.seats === 0) return item;

      const newAssignments = { ...item.assignments };
      for (let i = 0; i < type.seats; i++) {
        if (!newAssignments[i] && studentIndex < unassignedStudents.length) {
          newAssignments[i] = unassignedStudents[studentIndex++];
        }
      }
      return { ...item, assignments: newAssignments };
    });

    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playAlarm(settings.soundTheme);
  };

  const loadPreset = (presetKey: string) => {
    const presets: any = generatePresets(layoutStudentCount);
    const preset = presets[presetKey];
    if (preset) {
      setPlanItems(preset.items);
      savePlan(preset.items);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const getAssignedStudents = () => {
    const assigned = new Set<string>();
    planItems.forEach(item => {
      Object.values(item.assignments).forEach((name: any) => assigned.add(name));
    });
    return assigned;
  };

  const assignedSet = getAssignedStudents();

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4">
        <select 
          value={selectedClassId} 
          onChange={(e) => setSelectedClassId(e.target.value)} 
          className="px-4 py-2 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-xs outline-none transition-all cursor-pointer hover:border-indigo-100"
        >
          {settings.classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    );
  }, [selectedClassId, settings.classes, setHeaderActions]);

  return (
    <ToolPanel alignTop fluid baseWidth={1200} baseHeight={800}>
      <div className="flex w-full h-full gap-8 p-4 lg:p-8">

      {/* Primary Schematic Canvas */}
      <div 
        ref={constraintsRef}
        className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col items-center justify-center relative overflow-hidden group/stage"
      >
        <div className="absolute inset-0 bg-[#f8fafc]/30" style={{ backgroundImage: 'radial-gradient(#e2e8f0 2px, transparent 2px)', backgroundSize: '48px 48px' }} />
        
        <AnimatePresence>
          {planItems.map(item => {
            const type = FURNITURE_TYPES.find(t => t.id === item.typeId);
            if (!type) return null;

            return (
              <motion.div
                key={item.id}
                drag
                dragMomentum={false}
                onPointerDown={() => {
                  dragOffsetRef.current = { itemX: item.x, itemY: item.y };
                }}
                onDragEnd={(e, info) => {
                  updateItemPos(item.id, dragOffsetRef.current.itemX + info.offset.x, dragOffsetRef.current.itemY + info.offset.y);
                }}
                initial={{ x: item.x, y: item.y }}
                animate={{ 
                  x: item.x, 
                  y: item.y,
                  rotate: item.rotation || 0,
                  scale: selectedItem?.id === item.id ? 1.05 : 1
                }}
                whileDrag={{ scale: 1.1, zIndex: 100 }}
                onClick={() => setSelectedItem(item)}
                className={`absolute cursor-grab active:cursor-grabbing select-none p-4  flex items-center justify-center transition-all italic ${
                  selectedItem?.id === item.id ? 'ring-8 ring-indigo-500  z-50' : ' hover:border-indigo-100'
                } ${
                  type.type === 'circle' ? 'rounded-full' : 'rounded-[2rem]'
                } ${
                  type.type === 'teacher' ? 'bg-slate-950 text-white' : 'bg-white text-slate-800 border-4 border-slate-50'
                }`}
                style={{ width: type.w * 1.2, height: type.h * 1.2 }}
              >
                {type.type === 'teacher' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Monitor size={32} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Facilitator</span>
                  </div>
                ) : type.type === 'door' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 border-4 border-slate-200 text-slate-400 rounded-2xl">
                    <DoorOpen size={18} className="mb-2" />
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase">Gateway</span>
                  </div>
                ) : type.type === 'window' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-sky-50 border-4 border-sky-100 text-sky-400 rounded-2xl">
                    <span className="text-[9px] font-black tracking-[0.4em] uppercase">Viewport</span>
                  </div>
                ) : type.type === 'plant' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-emerald-50 border-4 border-emerald-100 text-emerald-500 rounded-full">
                    <TreePine size={40} />
                  </div>
                ) : type.type === 'smart-board' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 border-4 border-slate-800 text-white rounded-[2rem]  relative overflow-hidden">
                     <div className="absolute inset-0 bg-indigo-500/10" />
                     <Presentation size={20} className="mb-2 text-indigo-400" />
                     <span className="text-[9px] font-black tracking-[0.4em] uppercase">System Display</span>
                  </div>
                ) : (
                  <div className={`grid gap-4 w-full h-full ${type.seats === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {[...Array(type.seats)].map((_, i) => {
                      const assigned = item.assignments[i];
                      return (
                        <div 
                          key={i}
                          data-item-id={item.id}
                          data-seat-index={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({ ...item, activeSeat: i });
                          }}
                          className={`flex items-center justify-center text-[10px] font-black p-2 leading-none text-center transition-all overflow-hidden uppercase tracking-tighter  border-2 ${
                            type.type === 'circle' ? 'rounded-full' : 'rounded-[1.5rem]'
                          } ${
                            assigned 
                              ? 'bg-indigo-600 text-white border-white/20' 
                              : 'bg-slate-50 text-slate-300 border-white hover:border-indigo-200 hover:bg-white hover:text-indigo-400'
                          }`}
                        >
                          <span className="truncate w-full px-2 pointer-events-none">
                            {assigned ? assigned : <Plus size={16} strokeWidth={4} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <AnimatePresence>
                  {selectedItem?.id === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950 p-3 rounded-[2rem]  z-[110] border-4 border-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => rotateItem(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-2xl transition-colors"
                      >
                        <RotateCcw size={20} strokeWidth={3} />
                      </button>
                      <div className="w-px h-8 bg-white/10" />
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-colors"
                      >
                        <Trash2 size={20} strokeWidth={3} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <SettingsPanel isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Settings">
        <div className="flex flex-col h-full">
               {/* Tab Matrix */}
               <div className="flex border-4 border-white bg-white/50 rounded-[2.5rem] p-2 mb-8 ">
                 {[
                   { id: 'layouts', icon: LayoutIcon, label: 'Layouts' },
                   { id: 'furniture', icon: Plus, label: 'Furniture' },
                   { id: 'students', icon: Users, label: 'Units' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => {
                       setActiveTab(tab.id);
                       audioEngine.playTick(settings.soundTheme);
                     }}
                     className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all relative ${
                       activeTab === tab.id ? 'bg-indigo-600 text-white ' : 'text-slate-400 hover:text-slate-600'
                     }`}
                   >
                     <tab.icon size={20} strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                   </button>
                 ))}
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar custom-scrollbar pr-2">
                  <AnimatePresence mode="wait">
                    {activeTab === 'layouts' && (
                      <motion.div
                        key="layouts"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                         <div className="p-8 bg-slate-900 rounded-[3rem] border-4 border-slate-800  flex flex-col gap-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Target Capacity</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="100" 
                              value={layoutStudentCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) setLayoutStudentCount(val);
                              }}
                              className="w-full px-8 py-6 bg-white/10 border-2 border-white/10 rounded-[2rem] text-center font-black text-white text-4xl outline-none focus:border-indigo-400 transition-all italic tabular-nums"
                            />
                         </div>

                         <div className="grid grid-cols-1 gap-3">
                           {Object.entries(generatePresets(layoutStudentCount)).map(([key, preset]) => (
                             <button
                               key={key}
                               onClick={() => loadPreset(key)}
                               className="w-full p-8 bg-white hover:bg-indigo-50 border-4 border-white rounded-[2.5rem] flex items-center justify-between group transition-all "
                             >
                               <div className="flex flex-col text-left">
                                  <span className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-800 group-hover:text-indigo-600 italic leading-none">{preset.name}</span>
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Protocol: {key}</span>
                               </div>
                               <ChevronRight size={20} strokeWidth={3} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                             </button>
                           ))}
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'furniture' && (
                      <motion.div
                        key="furniture"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        {FURNITURE_TYPES.map(type => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => addItem(type.id)}
                              className="flex flex-col items-center gap-4 p-8 bg-white hover:bg-indigo-50 border-4 border-white rounded-[3rem] transition-all group   hover:scale-[1.02]"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-slate-50  flex items-center justify-center group-hover:scale-110 transition-transform">
                                 <Icon size={28} strokeWidth={3} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <span className="text-[10px] font-black uppercase text-center tracking-tight text-slate-800">{type.name}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}

                    {activeTab === 'students' && (
                      <motion.div
                        key="students"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 ">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Unit Registry</span>
                              <span className="text-xl font-black text-white tabular-nums italic">{students.length} Total</span>
                           </div>
                           <div className="flex gap-3">
                              <button onClick={randomiseSeating} className="p-3 bg-white/10 text-emerald-400 hover:bg-emerald-400 hover:text-white rounded-xl transition-all  active:scale-90" title="Auto-Fill"><Shuffle size={18} strokeWidth={3} /></button>
                              <button onClick={clearAssignments} className="p-3 bg-white/10 text-rose-400 hover:bg-rose-400 hover:text-white rounded-xl transition-all  active:scale-90" title="Purge"><RotateCcw size={18} strokeWidth={3} /></button>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                          {students.map(student => (
                            <motion.div
                              key={student}
                              drag
                              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                              dragElastic={1}
                              onDragEnd={(e, info) => {
                                const target = document.elementFromPoint(info.point.x, info.point.y);
                                const seatElement = target?.closest('[data-seat-index]');
                                if (seatElement) {
                                  const itemId = seatElement.getAttribute('data-item-id');
                                  const seatIndex = parseInt(seatElement.getAttribute('data-seat-index') || '0');
                                  if (itemId) assignStudent(itemId, seatIndex, student);
                                }
                              }}
                              className={`p-5 rounded-[2rem] text-left font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-between border-4  cursor-grab active:cursor-grabbing ${
                                assignedSet.has(student) 
                                  ? 'bg-slate-50 border-transparent text-slate-300' 
                                  : 'bg-white border-white text-slate-800 hover:border-indigo-100 hover:text-indigo-600'
                              }`}
                            >
                              <span className="truncate pr-4">{student}</span>
                              {assignedSet.has(student) ? <Check size={16} strokeWidth={4} /> : <Users size={16} className="opacity-20" />}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Unit Distribution Footer */}
               <div className="p-10 bg-indigo-600 rounded-[3.5rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-8">
                  <div className="tool-grid-bg opacity-10 pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                           <Activity size={20} strokeWidth={3} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Array Distribution</h4>
                     </div>
                     <span className="text-3xl font-black italic tabular-nums">{assignedSet.size} / {students.length}</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-white -[0_0_15px_rgba(255,255,255,0.5)]" 
                        initial={false}
                        animate={{ width: `${(assignedSet.size / Math.max(1, students.length)) * 100}%` }}
                     />
                  </div>
               </div>
        </div>
      </SettingsPanel>

      {/* Assignment Protocol Modal */}
      <AnimatePresence>
        {selectedItem && selectedItem.activeSeat !== undefined && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white p-12 w-full max-w-2xl flex flex-col gap-12 rounded-[5rem] border-[16px] border-indigo-50  italic relative overflow-hidden"
            >
              <div className="tool-grid-bg opacity-10 pointer-events-none" />
              <div className="flex justify-between items-center border-b-4 border-slate-50 pb-10 relative z-10">
                <div className="space-y-2">
                   <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Unit Logic</h3>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">Assign occupant for position {selectedItem.activeSeat + 1}</p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-20 h-20 flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-[2.5rem] transition-all  border-2 border-slate-100">
                  <X size={32} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-10 relative z-10">
                <div className="p-10 bg-slate-900 rounded-[4rem] flex items-center gap-10 border-4 border-slate-800 ">
                   <div className="w-28 h-28 bg-indigo-600 rounded-[3.5rem]  border-4 border-white/10 flex items-center justify-center font-black text-white text-5xl tabular-nums italic">
                    {selectedItem.activeSeat + 1}
                   </div>
                   <div className="space-y-2">
                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] leading-none mb-1">Assigned Signature</p>
                    <p className="font-black text-white uppercase text-4xl tracking-tighter">{selectedItem.assignments[selectedItem.activeSeat] || 'Position Vacant'}</p>
                   </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-6 grid grid-cols-2 gap-4 custom-scrollbar no-scrollbar">
                  <button
                    onClick={() => {
                      unassignSeat(selectedItem.id, selectedItem.activeSeat);
                      setSelectedItem(null);
                    }}
                    className="col-span-2 p-10 bg-slate-950 text-white rounded-[3.5rem] font-black text-[12px] uppercase tracking-[0.6em] hover:bg-rose-600 transition-all flex items-center justify-center gap-6  border-4 border-slate-800"
                  >
                    <UserMinus size={24} strokeWidth={3} /> Purge Occupant
                  </button>
                  
                  {students.map(student => (
                    <button
                      key={student}
                      onClick={() => {
                        assignStudent(selectedItem.id, selectedItem.activeSeat, student);
                        setSelectedItem(null);
                      }}
                      className={`p-6 rounded-[2.5rem] text-left font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-between border-4  ${
                        assignedSet.has(student) 
                          ? 'bg-slate-50 border-transparent text-slate-300' 
                          : 'bg-white border-slate-50 text-slate-800 hover:border-indigo-400 hover:text-indigo-600 '
                      }`}
                    >
                      <span className="truncate pr-4">{student}</span>
                      {!assignedSet.has(student) ? <UserPlus size={20} strokeWidth={3} className="opacity-20" /> : <Check size={20} strokeWidth={4} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </ToolPanel>
  );
};

export default SeatingPlanGenerator;
