import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trash2, RotateCcw, Shuffle, Save, Layout as LayoutIcon, 
  UserPlus, UserMinus, Monitor, Square, Circle, Grid3X3, Plus, X,
  DoorOpen, AppWindow, TreePine, Presentation, Settings
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ToolHeader } from '../ToolHeader';
import { audioEngine } from '../../utils/audio';

const FURNITURE_TYPES = [
  { id: 'desk-single', name: 'Single Desk', icon: Square, seats: 1, w: 80, h: 60, type: 'rect' },
  { id: 'table-double', name: 'Double Table', icon: Square, seats: 2, w: 140, h: 60, type: 'rect' },
  { id: 'table-quad', name: 'Quad Table', icon: Square, seats: 4, w: 140, h: 100, type: 'rect' },
  { id: 'table-round', name: 'Round Table', icon: Circle, seats: 4, w: 100, h: 100, type: 'circle' },
  { id: 'teacher-desk', name: 'Teacher Desk', icon: Monitor, seats: 0, w: 160, h: 80, type: 'teacher' },
  { id: 'door', name: 'Door', icon: DoorOpen, seats: 0, w: 100, h: 20, type: 'door' },
  { id: 'window', name: 'Window', icon: AppWindow, seats: 0, w: 120, h: 20, type: 'window' },
  { id: 'plant', name: 'Plant', icon: TreePine, seats: 0, w: 60, h: 60, type: 'plant' },
  { id: 'smart-board', name: 'Smart Board', icon: Presentation, seats: 0, w: 200, h: 20, type: 'smart-board' },
];

const generatePresets = (studentCount) => {
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
  let bottomCount = Math.min(8, numDouble); // Allow more on bottom to prevent too long sides
  let sideCount = numDouble - bottomCount;
  let leftCount = Math.ceil(sideCount / 2);
  let rightCount = Math.floor(sideCount / 2);
  
  const uShapeItems = [
    { id: 'door1', typeId: 'door', x: -30, y: 250, rotation: 90, assignments: {} },
    { id: 't1', typeId: 'teacher-desk', x: 350, y: 50, assignments: {} }
  ];
  
  const xOffset = 60;
  const rightX = 660; // Forced right edge
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
    traditional: { name: 'Rows', items: traditionalItems },
    clusters: { name: 'Groups', items: clusterItems },
    ushape: { name: 'U-Shape', items: uShapeItems }
  };
};

export const SeatingPlanGenerator = () => {
  const { settings } = useSettings();
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [planItems, setPlanItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [layoutStudentCount, setLayoutStudentCount] = useState(28);
  const [showConfig, setShowConfig] = useState(true);
  const constraintsRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const selectedClass = settings.classes.find(c => c.id === selectedClassId);
  const students = selectedClass ? selectedClass.students : [];

  // Load plan for selected class
  useEffect(() => {
    if (!selectedClassId) return;
    const savedPlans = JSON.parse(localStorage.getItem('teacher_tools_seating_plans') || '{}');
    if (savedPlans[selectedClassId]) {
      setPlanItems(savedPlans[selectedClassId]);
    } else {
      setPlanItems(generatePresets(layoutStudentCount).traditional.items);
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
    const presets = generatePresets(layoutStudentCount);
    const preset = presets[presetKey];
    if (preset) {
      setPlanItems(preset.items);
      savePlan(preset.items);
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
    <div className="w-full mx-auto h-full flex flex-col gap-6 px-4 pt-2 pb-8 select-none overflow-hidden">
      <ToolHeader
        title="Seating Plan Generator"
        icon={Users}
        description="Dynamic Classroom Layout Architect"
        infoContent={
          <>
            <p>
              <strong className="text-white block mb-1">Architecting the Room</strong>
              Drag and drop desks and tables to match your physical classroom layout. You can rotate items and add different table shapes.
            </p>
            <p>
              <strong className="text-white block mb-1">Smart Seating</strong>
              Select a class list to populate the seats. Use the shuffle tool to randomly assign students to desks, or drag students manually to specific spots.
            </p>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-transparent hover:border-slate-100 rounded-2xl font-black text-xs text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm h-[52px]"
          >
            {settings.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={randomiseSeating}
            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl hover:bg-blue-50 transition-all active:scale-95 border-2 border-transparent hover:border-blue-100 shadow-sm"
            title="Shuffle Students"
          >
            <Shuffle size={24} />
          </button>
          
          <button
            onClick={clearAssignments}
            className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl hover:bg-rose-50 transition-all active:scale-95 border-2 border-transparent hover:border-rose-100 shadow-sm"
            title="Clear All Seats"
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-3 rounded-2xl transition-all active:scale-95 border-2 shadow-sm ${
              showConfig 
                ? 'bg-slate-800 text-white border-slate-900 shadow-md' 
                : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
            }`}
            title="Toggle Config"
          >
            {showConfig ? <X size={24} /> : <Settings size={24} />}
          </button>
        </div>
      </ToolHeader>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 256 }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              className="w-64 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden"
            >
              {/* Layouts Section */}
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Layouts</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                    <span>Students:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={layoutStudentCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setLayoutStudentCount(val);
                      }}
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(generatePresets(layoutStudentCount)).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => loadPreset(key)}
                        className="w-full p-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-center font-bold transition-all text-[11px] truncate"
                        title={preset.name}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Furniture</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FURNITURE_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => addItem(type.id)}
                        className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all group"
                      >
                        <Icon size={24} className="text-slate-400 group-hover:text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-center">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col gap-3 flex-1 min-h-0">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex justify-between items-center">
                  Students
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{assignedSet.size}/{students.length}</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {students.map(student => (
                    <div 
                      key={student}
                      className={`p-1.5 px-3 rounded-xl text-sm font-bold flex items-center justify-between ${
                        assignedSet.has(student) ? 'bg-indigo-50 text-indigo-400' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {student}
                      {assignedSet.has(student) && <Users size={12} />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  dragMomentum={false}
                  onPointerDown={(e) => {
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
                  ) : type.type === 'door' ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-amber-100 border-2 border-amber-800/20 text-amber-900 rounded-[4px]">
                      <span className="text-[10px] font-black tracking-widest uppercase">DOOR</span>
                    </div>
                  ) : type.type === 'window' ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-sky-100 border-2 border-sky-400/30 text-sky-700 rounded-[4px]">
                      <span className="text-[10px] font-black tracking-widest uppercase">WINDOW</span>
                    </div>
                  ) : type.type === 'plant' ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-full">
                      <TreePine size={28} />
                    </div>
                  ) : type.type === 'smart-board' ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-800 border-4 border-slate-400 text-white rounded-lg shadow-inner">
                      <span className="text-[10px] font-black tracking-widest uppercase">SMART BOARD</span>
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
                            className={`flex items-center justify-center text-[9px] font-bold p-0.5 leading-tight text-center transition-all overflow-hidden ${
                              type.type === 'circle' ? 'rounded-full' : 'rounded-lg'
                            } ${
                              assigned 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-50 text-slate-300 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            <span className="truncate w-full px-1">
                              {assigned ? assigned.substring(0, 10) : <Plus size={12} />}
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
