import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trash2, RotateCcw, Shuffle, Save, Layout as LayoutIcon, 
  UserPlus, UserMinus, Monitor, Square, Circle, Grid3X3, Plus, X
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';

const FURNITURE_TYPES = [
  { id: 'desk-single', name: 'Single Desk', icon: Square, seats: 1, w: 80, h: 60, type: 'rect' },
  { id: 'table-double', name: 'Double Table', icon: Square, seats: 2, w: 140, h: 60, type: 'rect' },
  { id: 'table-quad', name: 'Quad Table', icon: Square, seats: 4, w: 140, h: 100, type: 'rect' },
  { id: 'table-round', name: 'Round Table', icon: Circle, seats: 4, w: 100, h: 100, type: 'circle' },
  { id: 'teacher-desk', name: 'Teacher Desk', icon: Monitor, seats: 0, w: 160, h: 80, type: 'teacher' },
];

const PRESETS = {
  traditional: {
    name: 'Traditional Rows',
    items: [
      { id: 't1', typeId: 'teacher-desk', x: 300, y: 50, assignments: {} },
      { id: 'd1', typeId: 'desk-single', x: 100, y: 200, assignments: {} },
      { id: 'd2', typeId: 'desk-single', x: 250, y: 200, assignments: {} },
      { id: 'd3', typeId: 'desk-single', x: 400, y: 200, assignments: {} },
      { id: 'd4', typeId: 'desk-single', x: 550, y: 200, assignments: {} },
      { id: 'd5', typeId: 'desk-single', x: 100, y: 320, assignments: {} },
      { id: 'd6', typeId: 'desk-single', x: 250, y: 320, assignments: {} },
      { id: 'd7', typeId: 'desk-single', x: 400, y: 320, assignments: {} },
      { id: 'd8', typeId: 'desk-single', x: 550, y: 320, assignments: {} },
      { id: 'd9', typeId: 'desk-single', x: 100, y: 440, assignments: {} },
      { id: 'd10', typeId: 'desk-single', x: 250, y: 440, assignments: {} },
      { id: 'd11', typeId: 'desk-single', x: 400, y: 440, assignments: {} },
      { id: 'd12', typeId: 'desk-single', x: 550, y: 440, assignments: {} },
    ]
  },
  clusters: {
    name: 'Group Clusters',
    items: [
      { id: 't1', typeId: 'teacher-desk', x: 300, y: 50, assignments: {} },
      { id: 'c1', typeId: 'table-quad', x: 100, y: 200, assignments: {} },
      { id: 'c2', typeId: 'table-quad', x: 450, y: 200, assignments: {} },
      { id: 'c3', typeId: 'table-quad', x: 100, y: 400, assignments: {} },
      { id: 'c4', typeId: 'table-quad', x: 450, y: 400, assignments: {} },
    ]
  },
  ushape: {
    name: 'U-Shape',
    items: [
      { id: 't1', typeId: 'teacher-desk', x: 300, y: 50, assignments: {} },
      { id: 'u1', typeId: 'table-double', x: 100, y: 150, assignments: {}, rotation: 90 },
      { id: 'u2', typeId: 'table-double', x: 100, y: 300, assignments: {}, rotation: 90 },
      { id: 'u3', typeId: 'table-double', x: 100, y: 450, assignments: {}, rotation: 90 },
      { id: 'u4', typeId: 'table-double', x: 250, y: 500, assignments: {} },
      { id: 'u5', typeId: 'table-double', x: 400, y: 500, assignments: {} },
      { id: 'u6', typeId: 'table-double', x: 550, y: 150, assignments: {}, rotation: 270 },
      { id: 'u7', typeId: 'table-double', x: 550, y: 300, assignments: {}, rotation: 270 },
      { id: 'u8', typeId: 'table-double', x: 550, y: 450, assignments: {}, rotation: 270 },
    ]
  }
};

export const SeatingPlanGenerator = () => {
  const { settings } = useSettings();
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [planItems, setPlanItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPresets, setShowPresets] = useState(false);
  const constraintsRef = useRef(null);

  const selectedClass = settings.classes.find(c => c.id === selectedClassId);
  const students = selectedClass ? selectedClass.students : [];

  // Load plan for selected class
  useEffect(() => {
    if (!selectedClassId) return;
    const savedPlans = JSON.parse(localStorage.getItem('teacher_tools_seating_plans') || '{}');
    if (savedPlans[selectedClassId]) {
      setPlanItems(savedPlans[selectedClassId]);
    } else {
      setPlanItems(PRESETS.traditional.items);
    }
  }, [selectedClassId]);

  // Save plan when items change
  const savePlan = (items) => {
    if (!selectedClassId) return;
    const savedPlans = JSON.parse(localStorage.getItem('teacher_tools_seating_plans') || '{}');
    savedPlans[selectedClassId] = items;
    localStorage.setItem('teacher_tools_seating_plans', JSON.stringify(savedPlans));
  };

  const addItem = (typeId) => {
    const newItem = {
      id: `item-${Date.now()}`,
      typeId,
      x: 100,
      y: 100,
      assignments: {},
      rotation: 0
    };
    const updated = [...planItems, newItem];
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const updateItemPos = (id, x, y) => {
    const updated = planItems.map(item => item.id === id ? { ...item, x, y } : item);
    setPlanItems(updated);
    savePlan(updated);
  };

  const removeItem = (id) => {
    const updated = planItems.filter(item => item.id !== id);
    setPlanItems(updated);
    setSelectedItem(null);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const rotateItem = (id) => {
    const updated = planItems.map(item => 
      item.id === id ? { ...item, rotation: ((item.rotation || 0) + 90) % 360 } : item
    );
    setPlanItems(updated);
    savePlan(updated);
  };

  const assignStudent = (itemId, seatIndex, studentName) => {
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
      // If student is already assigned elsewhere, remove them
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

  const unassignSeat = (itemId, seatIndex) => {
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

  const clearAssignments = () => {
    const updated = planItems.map(item => ({ ...item, assignments: {} }));
    setPlanItems(updated);
    savePlan(updated);
    audioEngine.playTick(settings.soundTheme);
  };

  const loadPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setPlanItems(preset.items);
      savePlan(preset.items);
      setShowPresets(false);
      audioEngine.playTick(settings.soundTheme);
    }
  };

  const getAssignedStudents = () => {
    const assigned = new Set();
    planItems.forEach(item => {
      Object.values(item.assignments).forEach(name => assigned.add(name));
    });
    return assigned;
  };

  const assignedSet = getAssignedStudents();

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-180px)] flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <LayoutIcon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Seating Plan</h2>
            <p className="text-slate-400 font-medium text-sm mt-1">Design your classroom and assign students.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-600"
          >
            {settings.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
          >
            <Grid3X3 size={18} /> PRESETS
          </button>

          <button
            onClick={randomiseSeating}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Shuffle size={18} /> RANDOMISE
          </button>

          <button
            onClick={clearAssignments}
            className="p-3 text-slate-400 hover:text-red-500 transition-colors"
            title="Clear all assignments"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Presets Popover */}
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-0 right-0 z-50 bg-white p-6 rounded-3xl shadow-2xl border-2 border-slate-100 w-64"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Presets</h3>
                <button onClick={() => setShowPresets(false)}><X size={18} /></button>
              </div>
              <div className="space-y-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => loadPreset(key)}
                    className="w-full p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-left font-bold transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar Sidebar */}
        <div className="w-64 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Furniture</h3>
            <div className="grid grid-cols-2 gap-2">
              {FURNITURE_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => addItem(type.id)}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all group"
                  >
                    <Icon size={24} className="text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-[10px] font-black uppercase text-center">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4 flex-1 min-h-0">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex justify-between items-center">
              Students
              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{assignedSet.size}/{students.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1">
              {students.map(student => (
                <div 
                  key={student}
                  className={`p-2 rounded-xl text-sm font-bold flex items-center justify-between ${
                    assignedSet.has(student) ? 'bg-indigo-50 text-indigo-400' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {student}
                  {assignedSet.has(student) && <Users size={12} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={constraintsRef}
          className="flex-1 bg-slate-100/50 rounded-[3rem] border-4 border-dashed border-slate-200 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]"
        >
          {/* Legend */}
          <div className="absolute bottom-6 right-6 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 pointer-events-none">
            DRAG TO POSITION • CLICK TO ASSIGN
          </div>

          <AnimatePresence>
            {planItems.map(item => {
              const type = FURNITURE_TYPES.find(t => t.id === item.typeId);
              if (!type) return null;

              return (
                <motion.div
                  key={item.id}
                  drag
                  dragConstraints={constraintsRef}
                  onDragEnd={(e, info) => {
                    const rect = constraintsRef.current.getBoundingClientRect();
                    updateItemPos(item.id, info.point.x - rect.left - type.w/2, info.point.y - rect.top - type.h/2);
                  }}
                  initial={{ x: item.x, y: item.y }}
                  animate={{ 
                    x: item.x, 
                    y: item.y,
                    rotate: item.rotation || 0,
                    scale: selectedItem?.id === item.id ? 1.02 : 1
                  }}
                  whileDrag={{ scale: 1.05, zIndex: 100 }}
                  onClick={() => setSelectedItem(item)}
                  className={`absolute cursor-move select-none p-2 shadow-md flex items-center justify-center transition-shadow ${
                    selectedItem?.id === item.id ? 'ring-4 ring-indigo-500 shadow-xl' : 'hover:shadow-lg'
                  } ${
                    type.type === 'circle' ? 'rounded-full' : 'rounded-xl'
                  } ${
                    type.type === 'teacher' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 border-2 border-slate-200'
                  }`}
                  style={{ width: type.w, height: type.h }}
                >
                  {type.type === 'teacher' ? (
                    <div className="flex flex-col items-center gap-1">
                      <Monitor size={24} />
                      <span className="text-[10px] font-black uppercase">TEACHER</span>
                    </div>
                  ) : (
                    <div className={`grid gap-1 w-full h-full ${type.seats === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {[...Array(type.seats)].map((_, i) => {
                        const assigned = item.assignments[i];
                        return (
                          <div 
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ ...item, activeSeat: i });
                            }}
                            title={assigned || 'Empty seat'}
                            className={`flex items-center justify-center text-[10px] font-black p-1 text-center transition-all overflow-hidden ${
                              type.type === 'circle' ? 'rounded-full' : 'rounded-lg'
                            } ${
                              assigned 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-50 text-slate-300 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            <span className="truncate w-full px-1">
                              {assigned ? assigned.substring(0, 8) : <Plus size={12} />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions Bar (visible when selected) */}
                  <AnimatePresence>
                    {selectedItem?.id === item.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900 p-1 rounded-xl shadow-xl z-[110]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => rotateItem(item.id)}
                          className="p-2 text-white hover:text-indigo-400"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-white hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Seat Assignment Modal */}
      <AnimatePresence>
        {selectedItem && selectedItem.activeSeat !== undefined && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[3rem] shadow-2xl border-2 border-slate-100 p-8 w-full max-w-md flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">Assign Student</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-indigo-600">
                    {selectedItem.activeSeat + 1}
                   </div>
                   <div>
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Selected Seat</p>
                    <p className="font-bold text-slate-700">Currently: {selectedItem.assignments[selectedItem.activeSeat] || 'Empty'}</p>
                   </div>
                </div>

                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  <button
                    onClick={() => {
                      unassignSeat(selectedItem.id, selectedItem.activeSeat);
                      setSelectedItem(null);
                    }}
                    className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <UserMinus size={18} /> UNASSIGN SEAT
                  </button>
                  
                  {students.map(student => (
                    <button
                      key={student}
                      onClick={() => {
                        assignStudent(selectedItem.id, selectedItem.activeSeat, student);
                        setSelectedItem(null);
                      }}
                      className={`w-full p-4 rounded-2xl text-left font-bold transition-all flex items-center justify-between ${
                        assignedSet.has(student) 
                          ? 'bg-slate-50 text-slate-400' 
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      {student}
                      {!assignedSet.has(student) && <UserPlus size={18} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
