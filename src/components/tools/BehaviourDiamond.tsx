import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Info,
  Sliders,
  Type,
  Palette,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { FormattedMessage, useIntl } from 'react-intl';

// 1. Types & Interfaces
interface LevelConfig {
  id: string;
  key: string;
  defaultLabel: string;
  defaultColor: string;
}

interface CustomLevelSettings {
  id: string;
  label: string;
  color: string;
}

interface StudentPosition {
  levelId: string;
  slotIndex?: number;
}

interface StudentPositionMap {
  [classId: string]: {
    [studentName: string]: StudentPosition;
  };
}

// 2. Constants
const DEFAULT_LEVELS: LevelConfig[] = [
  { id: 'amazing', key: 'amazing', defaultLabel: 'Amazing', defaultColor: 'var(--diamond-amazing-color)' },
  { id: 'great_job', key: 'great_job', defaultLabel: 'Great Job', defaultColor: 'var(--diamond-great-color)' },
  { id: 'ready_to_learn', key: 'ready_to_learn', defaultLabel: 'Ready to Learn', defaultColor: 'var(--diamond-ready-color)' },
  { id: 'warning', key: 'warning', defaultLabel: 'Warning', defaultColor: 'var(--diamond-warning-color)' },
  { id: 'teachers_choice', key: 'teachers_choice', defaultLabel: 'Teacher\'s Choice', defaultColor: 'var(--diamond-choice-color)' }
];

const COLOR_PRESETS = [
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#22c55e', // Green
  '#eab308', // Yellow
  '#f97316', // Orange
  '#ef4444', // Red
  '#64748b'  // Slate
];

export const BehaviourDiamond = () => {
  const { settings } = useSettings();
  const {
    setHeaderActions,
    setHeaderInfo,
    setOnReset,
    setOnConfigToggle,
    setHasConfig,
    clearHeader,
    isConfigOpen,
    setIsConfigOpen
  } = useHeader();
  const intl = useIntl();

  // 3. State & Local Storage Hooks
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem('behaviour_diamond_active_class_id');
      if (saved) return saved;
    } catch { /* ignore */ }
    return settings.classes[0]?.id || 'blank';
  });

  const [levelSettings, setLevelSettings] = useState<CustomLevelSettings[]>(() => {
    try {
      const saved = window.localStorage.getItem('behaviour_diamond_level_config');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_LEVELS.map(d => ({
      id: d.id,
      label: d.defaultLabel,
      color: d.defaultColor
    }));
  });

  const [studentPositions, setStudentPositions] = useState<StudentPositionMap>(() => {
    try {
      const saved = window.localStorage.getItem('behaviour_diamond_student_positions');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {};
  });

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  // Determine active students in the selected class
  const activeClass = useMemo(() => {
    return settings.classes.find(c => c.id === selectedClassId) || null;
  }, [settings.classes, selectedClassId]);

  const studentsList = useMemo(() => {
    return activeClass?.students || [];
  }, [activeClass]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save state updates to Local Storage
  useEffect(() => {
    try {
      window.localStorage.setItem('behaviour_diamond_active_class_id', selectedClassId);
    } catch { /* ignore */ }
  }, [selectedClassId]);

  useEffect(() => {
    try {
      window.localStorage.setItem('behaviour_diamond_level_config', JSON.stringify(levelSettings));
    } catch { /* ignore */ }
  }, [levelSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem('behaviour_diamond_student_positions', JSON.stringify(studentPositions));
    } catch { /* ignore */ }
  }, [studentPositions]);

  // Calculate dynamic card width based on the longest name in the loaded class, respecting 3x size on mobile
  const cardWidth = useMemo(() => {
    if (studentsList.length === 0) return '90px';
    const maxLen = Math.max(...studentsList.map(s => s.length));
    if (isMobile) {
      const calculatedWidth = Math.max(190, maxLen * 20 + 80);
      return `${calculatedWidth}px`;
    }
    const calculatedWidth = Math.max(90, maxLen * 8.5 + 46);
    return `${calculatedWidth}px`;
  }, [studentsList, isMobile]);

  // Sync with main app configuration header
  const triggerResetAll = useCallback(() => {
    if (selectedClassId === 'blank' || studentsList.length === 0) return;
    setStudentPositions(prev => {
      const updated = { ...prev };
      const currentClassPositions: Record<string, StudentPosition> = {};
      const levelId = 'ready_to_learn';

      studentsList.forEach((student, index) => {
        currentClassPositions[student] = { levelId, slotIndex: index };
      });

      updated[selectedClassId] = currentClassPositions;
      return updated;
    });
    audioEngine.playTick(settings.soundTheme);
  }, [selectedClassId, settings.soundTheme, studentsList]);

  // Unified header setup (Config, Reset actions, and Class Selector)
  useEffect(() => {
    setHasConfig(true);
    setOnReset(() => triggerResetAll);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));

    setHeaderInfo(
      <div className="space-y-4 font-['Outfit'] text-slate-800">
        <h3 className="text-xl font-black uppercase tracking-tight italic">
          <FormattedMessage id="behaviourdiamond.info.title" defaultMessage="About the Behaviour Diamond" />
        </h3>
        <p className="text-sm font-semibold leading-relaxed">
          <FormattedMessage
            id="behaviourdiamond.context_text"
            defaultMessage="The Behaviour Diamond helps kids make great choices! Students show their feelings and choices by moving up and down the diamond levels during the school day."
          />
        </p>
      </div>
    );

    setHeaderActions(
      <div className="flex items-center gap-4 italic font-['Outfit']">
        <div className="flex bg-surface p-1.5 rounded-2xl border-2 border-slate-900">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              audioEngine.playTick(settings.soundTheme);
            }}
            className="px-6 py-2 bg-transparent rounded-xl font-black text-[10px] text-slate-800 outline-none transition-all uppercase tracking-widest cursor-pointer border-none"
          >
            <option value="blank">{intl.formatMessage({ id: 'classpanel.option.blank', defaultMessage: '(Blank)' })}</option>
            {settings.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    );

    return () => {
      clearHeader();
    };
  }, [
    selectedClassId,
    settings.classes,
    settings.soundTheme,
    triggerResetAll,
    setIsConfigOpen,
    setHasConfig,
    setOnReset,
    setOnConfigToggle,
    setHeaderActions,
    setHeaderInfo,
    clearHeader,
    intl
  ]);

  // Safe getter for student position (handles retrofitted simple string format gracefully)
  const getStudentPos = useCallback((studentName: string): StudentPosition => {
    const classPositions = studentPositions[selectedClassId];
    if (classPositions && classPositions[studentName]) {
      const pos = classPositions[studentName];
      if (typeof pos === 'string') {
        return { levelId: pos, slotIndex: 0 };
      }
      return {
        levelId: pos.levelId || 'ready_to_learn',
        slotIndex: pos.slotIndex !== undefined ? pos.slotIndex : 0
      };
    }
    return { levelId: 'ready_to_learn', slotIndex: 0 };
  }, [studentPositions, selectedClassId]);

  // Initialize student levels & slot indices if they don't exist yet in the positions state
  useEffect(() => {
    if (selectedClassId === 'blank' || studentsList.length === 0) return;

    setStudentPositions(prev => {
      const classPositions = prev[selectedClassId] || {};
      const needsInitialization = studentsList.some(student => {
        const pos = classPositions[student];
        return !pos || pos.slotIndex === undefined;
      });

      if (!needsInitialization) return prev;

      const updated = { ...prev };
      const currentClassPositions = { ...classPositions };

      // Group students by level to assign them sequential slot indices per level
      const levelCounters: Record<string, number> = {};

      studentsList.forEach(student => {
        const pos = currentClassPositions[student];
        let levelId = 'ready_to_learn';
        let slotIndex = pos?.slotIndex;

        if (pos) {
          levelId = pos.levelId;
        }

        if (slotIndex === undefined) {
          if (levelCounters[levelId] === undefined) {
            // Find the first free slot index for existing students in this level
            let maxSlot = -1;
            Object.values(currentClassPositions).forEach(p => {
              if (p && p.levelId === levelId && p.slotIndex !== undefined) {
                if (p.slotIndex > maxSlot) {
                  maxSlot = p.slotIndex;
                }
              }
            });
            levelCounters[levelId] = maxSlot + 1;
          }
          slotIndex = levelCounters[levelId];
          levelCounters[levelId]++;
        }

        currentClassPositions[student] = {
          levelId,
          slotIndex
        };
      });

      updated[selectedClassId] = currentClassPositions;
      return updated;
    });
  }, [selectedClassId, studentsList]);

  // Moves the student one step up or down (snaps automatically)
  const handleShiftStudent = useCallback((studentName: string, direction: 'up' | 'down') => {
    const currentPos = getStudentPos(studentName);
    const currentIndex = levelSettings.findIndex(l => l.id === currentPos.levelId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < levelSettings.length - 1) {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex !== currentIndex) {
      const targetLevelId = levelSettings[targetIndex].id;

      setStudentPositions(prev => {
        const updated = { ...prev };
        const currentClassPositions = updated[selectedClassId] ? { ...updated[selectedClassId] } : {};

        // Find the first vacant slot index in the target level (gap filling)
        const occupiedSlots = new Set<number>();
        Object.entries(currentClassPositions).forEach(([name, pos]) => {
          if (name !== studentName && pos && pos.levelId === targetLevelId && pos.slotIndex !== undefined) {
            occupiedSlots.add(pos.slotIndex);
          }
        });

        let targetSlotIndex = 0;
        while (occupiedSlots.has(targetSlotIndex)) {
          targetSlotIndex++;
        }

        currentClassPositions[studentName] = {
          levelId: targetLevelId,
          slotIndex: targetSlotIndex
        };

        updated[selectedClassId] = currentClassPositions;
        return updated;
      });
      audioEngine.playTick(settings.soundTheme);
    }
  }, [levelSettings, getStudentPos, selectedClassId, settings.soundTheme]);

  // Group students by level for reactive rendering in separate rows, accounting for slot gaps
  const studentsByLevel = useMemo(() => {
    const groups: Record<string, (string | undefined)[]> = {};
    levelSettings.forEach(l => {
      groups[l.id] = [];
    });

    if (selectedClassId !== 'blank') {
      const levelStudents: Record<string, { name: string; slotIndex: number }[]> = {};
      levelSettings.forEach(l => {
        levelStudents[l.id] = [];
      });

      studentsList.forEach(student => {
        const pos = getStudentPos(student);
        const lvl = pos.levelId || 'ready_to_learn';
        const slotIdx = pos.slotIndex !== undefined ? pos.slotIndex : 0;
        levelStudents[lvl].push({ name: student, slotIndex: slotIdx });
      });

      // Construct the slot array for each level, leaving gaps (undefined) where slots are vacant
      Object.entries(levelStudents).forEach(([lvl, students]) => {
        if (students.length === 0) {
          groups[lvl] = [];
          return;
        }

        // Find max slotIndex in this level to set appropriate slot size
        const maxSlotIdx = Math.max(...students.map(s => s.slotIndex));
        const slotArray: (string | undefined)[] = Array.from({ length: maxSlotIdx + 1 });

        students.forEach(student => {
          slotArray[student.slotIndex] = student.name;
        });

        groups[lvl] = slotArray;
      });
    }

    return groups;
  }, [studentsList, levelSettings, getStudentPos, selectedClassId]);

  // 5. Config Drawer handlers
  const handleUpdateLevelText = (id: string, label: string) => {
    setLevelSettings(prev => prev.map(l => l.id === id ? { ...l, label } : l));
  };

  const handleUpdateLevelColor = (id: string, color: string) => {
    setLevelSettings(prev => prev.map(l => l.id === id ? { ...l, color } : l));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out gap-6 font-['Outfit'] select-none relative">

      {/* ========================================================
          LEFT: CONFIG PANEL (using shared SettingsPanel component)
          ======================================================== */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] p-4 bg-slate-100/60 backdrop-blur-xl lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:w-[320px] lg:h-full flex flex-col gap-6 italic overflow-hidden shrink-0"
          >
            <SettingsPanel
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              className="h-full"
              side="left"
              title={intl.formatMessage({ id: 'behaviourdiamond.settings', defaultMessage: 'Configuration' })}
            >
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-120px)] pr-1.5 custom-scrollbar">
                {levelSettings.map((level, index) => (
                  <div
                    key={level.id}
                    className="flex flex-col gap-1 py-1 border-b border-slate-100 last:border-b-0"
                  >
                    {/* Top Row: Number on Left, Name Input on Right */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={(() => {
                          const defaultLevel = DEFAULT_LEVELS.find(d => d.id === level.id);
                          if (defaultLevel && level.label === defaultLevel.defaultLabel) {
                            return intl.formatMessage({ id: `behaviourdiamond.level.${level.id}`, defaultMessage: level.label });
                          }
                          return level.label;
                        })()}
                        onChange={(e) => handleUpdateLevelText(level.id, e.target.value)}
                        className="flex-1 px-3 py-1 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-800 outline-none animate-none"
                        placeholder={intl.formatMessage({ id: `behaviourdiamond.level.${level.id}`, defaultMessage: 'Level Name' })}
                      />
                    </div>

                    {/* Bottom Row: Compact Color Presets (Aligned with Input) */}
                    <div className="flex gap-1.5 items-center justify-between pl-[36px] pr-1 py-1">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleUpdateLevelColor(level.id, color)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${level.color === color ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}

                      {/* Custom Color Selector Bubble */}
                      <div className="relative w-5 h-5 rounded-full overflow-hidden border-2 border-slate-200 flex items-center justify-center hover:scale-105 shrink-0">
                        <input
                          type="color"
                          value={level.color.startsWith('var(') ? '#cbd5e1' : level.color}
                          onChange={(e) => handleUpdateLevelColor(level.id, e.target.value)}
                          className="absolute scale-150 cursor-pointer opacity-100"
                          style={{ border: 'none', background: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          RIGHT: MAIN CONTENT AREA (Behaviour Diamond Flex Row Stack)
          ======================================================== */}
      <ToolPanel
        className={`${isConfigOpen && isMobile ? 'hidden' : 'flex-1'} p-6 flex flex-col relative overflow-hidden`}
        fluid={true}
      >
        {selectedClassId === 'blank' || studentsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 border-4 border-slate-900 rounded-full flex items-center justify-center text-3xl mb-4">💎</div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-2">
              <FormattedMessage id="behaviourdiamond.select_class_to_start" defaultMessage="Ready to track choices?" />
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-sm">
              <FormattedMessage id="behaviourdiamond.select_class_to_start_desc" defaultMessage="Please load a class with student names from the Class selector at the top to start tracking choices!" />
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col gap-2 items-center overflow-y-auto pr-1">
            {levelSettings.map((level) => {
              const slotsInLevel = studentsByLevel[level.id] || [];
              
              const getLevelLayout = (id: string) => {
                if (id === 'ready_to_learn') return { flex: '2.6 2.6 0%', minHeight: '140px', width: '100%' };
                if (id === 'great_job' || id === 'warning') return { flex: '1.26 1.26 0%', minHeight: '81px', width: '90%' };
                return { flex: '0.8 0.8 0%', minHeight: '45px', width: '80%' };
              };
              const layout = getLevelLayout(level.id);

              return (
                <div
                  key={level.id}
                  className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-1.5 px-3 md:px-4 rounded-2xl border-[3px] border-slate-900 transition-all select-none"
                  style={{
                    backgroundColor: `${level.color}15`,
                    borderColor: level.color,
                    ...layout
                  }}
                >
                  {/* Level Label Badge */}
                  <div className="flex items-center gap-2 shrink-0 md:w-40">
                    <span
                      className="px-6 py-2 lg:px-4 lg:py-1.5 text-[30px] lg:text-xs font-black text-white uppercase tracking-widest rounded-full border-2 border-slate-900"
                      style={{ backgroundColor: level.color }}
                    >
                      {(() => {
                        const defaultLevel = DEFAULT_LEVELS.find(d => d.id === level.id);
                        if (defaultLevel && level.label === defaultLevel.defaultLabel) {
                          return intl.formatMessage({ id: `behaviourdiamond.level.${level.id}`, defaultMessage: level.label });
                        }
                        return level.label;
                      })()}
                    </span>
                    <span className="text-[24px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ({slotsInLevel.filter(Boolean).length})
                    </span>
                  </div>

                  {/* Student Cards Flex-Wrap Container */}
                  <div className="flex-1 flex flex-wrap gap-x-2.5 gap-y-0.5 items-center">
                    {slotsInLevel.map((slotItem, slotIndex) => {
                      return (
                        <div
                          key={`slot-${level.id}-${slotIndex}`}
                          className="inline-flex items-center shrink-0 h-[60px] lg:h-[30px] relative"
                          style={{ width: cardWidth }}
                        >
                          <AnimatePresence>
                            {slotItem && (
                              <StudentCard
                                name={slotItem}
                                color={level.color}
                                isAtTop={level.id === levelSettings[0].id}
                                isAtBottom={level.id === levelSettings[levelSettings.length - 1].id}
                                onShift={(dir) => handleShiftStudent(slotItem, dir)}
                                isMobile={isMobile}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ToolPanel>

    </div>
  );
};

// ========================================================
// 7. SUBCOMPONENTS
// ========================================================

interface StudentCardProps {
  name: string;
  color: string;
  isAtTop: boolean;
  isAtBottom: boolean;
  onShift: (direction: 'up' | 'down') => void;
  isMobile: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({
  name,
  color,
  isAtTop,
  isAtBottom,
  onShift,
  isMobile
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 flex items-center bg-white border-[3px] border-slate-900 rounded-xl text-[30px] lg:text-[10px] font-black text-slate-800 transition-all select-none p-1.5 lg:p-1 justify-between gap-1 hover:scale-105 active:scale-95"
      style={{
        borderColor: color
      }}
    >
      {/* Green Up Arrow on the Left */}
      <button
        onClick={() => onShift('up')}
        disabled={isAtTop}
        className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 p-0.5 rounded transition-all disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center shrink-0 active:scale-90"
        title="Move Up"
      >
        <ChevronUp size={isMobile ? 24 : 13} strokeWidth={4} />
      </button>

      {/* Name in the Center */}
      <span className="truncate min-w-0 font-black text-center px-1 flex-1 uppercase tracking-wider">
        {name}
      </span>

      {/* Red Down Arrow on the Right */}
      <button
        onClick={() => onShift('down')}
        disabled={isAtBottom}
        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-0.5 rounded transition-all disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center shrink-0 active:scale-90"
        title="Move Down"
      >
        <ChevronDown size={isMobile ? 24 : 13} strokeWidth={4} />
      </button>
    </motion.div>
  );
};

export default BehaviourDiamond;
