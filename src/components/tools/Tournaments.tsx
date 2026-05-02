import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, 
  Users, 
  Play, 
  RotateCcw,
  Trash2, 
  Plus, 
  Shuffle, 
  List as ListIcon, 
  Settings, 
  X,
  Shield, 
  TrendingUp, 
  Check, 
  MousePointer2, 
  ChevronUp,
  ChevronDown, 
  Maximize2, 
  UserPlus, 
  Info, 
  Star, 
  History,
  ChevronLeft, 
  ChevronRight,
  Activity,
  Zap,
  Target,
  Layout,
  Crown,
  BrainCircuit,
  Volume2
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { shuffle } from '../../utils/random';

// 1. Constants
const K_FACTOR = 32;
const BASE_RATING = 1200;

// 2. Config (None)

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tournament Arena Protocol</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Configure your <b>Tournament Type</b> (Single, Double, or Elo) and participant capacity in the setup stage.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">In <b>Elimination</b> modes, click on a participant to advance them to the next bracket round.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0">3</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">In <b>Elo</b> mode, select a winner and a loser to recalibrate the skill ratings across the entire class matrix.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600 shrink-0">4</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">The <b>Grand Final</b> winner is crowned automatically once the final bracket match is resolved.</p>
      </div>
    </div>
  </div>
);

// 4. Local Storage (None)

// 5. Classes (EloManager, etc. - converted to components)

// 6. Functions (Helper Components and Logic)
const EloManager = ({ participants, eloRatings, setEloRatings, eloHistory, setEloHistory }: any) => {
  const [selectedWinner, setSelectedWinner] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { settings } = useSettings();
  const itemsPerPage = 8;
  const matchIdCounter = useRef(0);

  useEffect(() => {
    if (matchIdCounter.current === 0) matchIdCounter.current = Date.now();
  }, []);

  const recalculateAll = (history: any[]) => {
    const newRatings: Record<string, number> = {};
    participants.forEach((p: string) => newRatings[p] = 1200);

    const processedHistory = [...history].reverse().map(m => {
      if (!m.winner || !m.loser) return m;

      const rW = newRatings[m.winner] || BASE_RATING;
      const rL = newRatings[m.loser] || BASE_RATING;

      const eW = 1 / (1 + Math.pow(10, (rL - rW) / 400));
      const eL = 1 / (1 + Math.pow(10, (rW - rL) / 400));

      const nW = Math.round(rW + K_FACTOR * (1 - eW));
      const nL = Math.round(rL + K_FACTOR * (0 - eL));

      newRatings[m.winner] = nW;
      newRatings[m.loser] = nL;

      return {
        ...m,
        winnerOld: rW,
        winnerNew: nW,
        loserOld: rL,
        loserNew: nL
      };
    });

    setEloRatings(newRatings);
    setEloHistory(processedHistory.reverse());
  };

  const recordMatch = (winner: string, loser: string) => {
    if (!winner || !loser || winner === loser) return;

    const rW = eloRatings[winner] || BASE_RATING;
    const rL = eloRatings[loser] || BASE_RATING;

    const eW = 1 / (1 + Math.pow(10, (rL - rW) / 400));
    const eL = 1 / (1 + Math.pow(10, (rW - rL) / 400));

    const nW = Math.round(rW + K_FACTOR * (1 - eW));
    const nL = Math.round(rL + K_FACTOR * (0 - eL));

    setEloRatings((prev: any) => ({ ...prev, [winner]: nW, [loser]: nL }));

    const match = {
      id: matchIdCounter.current++,
      winner,
      loser,
      winnerOld: rW,
      winnerNew: nW,
      loserOld: rL,
      loserNew: nL,
      date: new Date().toISOString()
    };
    setEloHistory([match, ...eloHistory]);
    audioEngine.playAlarm(settings.soundTheme);
  };

  const handleStudentClick = (student: string) => {
    audioEngine.playTick(settings.soundTheme);
    if (editingMatchId) {
      const match = eloHistory.find((m: any) => m.id === editingMatchId);
      if (!match) return;

      let newHistory;
      if (match.winner === student) {
        newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, winner: null } : m);
      } else if (match.loser === student) {
        newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, loser: null } : m);
      } else if (!match.winner) {
        newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, winner: student } : m);
      } else if (!match.loser) {
        newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, loser: student } : m);
      } else {
        return;
      }

      recalculateAll(newHistory);
      const updatedMatch = newHistory.find((m: any) => m.id === editingMatchId);
      if (updatedMatch.winner && updatedMatch.loser) setEditingMatchId(null);
      return;
    }

    if (!selectedWinner) {
      setSelectedWinner(student);
    } else if (selectedWinner === student) {
      setSelectedWinner('');
    } else {
      recordMatch(selectedWinner, student);
      setSelectedWinner('');
    }
  };

  const deleteMatch = (id: number) => {
    const newHistory = eloHistory.filter((m: any) => m.id !== id);
    recalculateAll(newHistory);
    setEditingMatchId(null);
    audioEngine.playTick(settings.soundTheme);
  };

  const sortedParticipants = [...participants].sort((a: string, b: string) => (eloRatings[b] || 1200) - (eloRatings[a] || 1200));
  const totalPages = Math.ceil(eloHistory.length / itemsPerPage);
  const currentHistory = eloHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0 italic">
      {/* Rankings Board */}
      <div className="flex-1 bg-slate-50/50 rounded-[4rem] border-4 border-white  flex flex-col gap-8 p-12 overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white ">
                 <Trophy size={24} strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Apex Leaderboard</h3>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill-Based Tier Synthesis</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Active</span>
                 <span className="text-sm font-black text-slate-800 tabular-nums">{participants.length} Candidates</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 no-scrollbar pb-8 flex-1">
           {sortedParticipants.map((p: string, i: number) => {
             const isWinner = eloHistory.find((m: any) => m.id === editingMatchId)?.winner === p;
             const isLoser = eloHistory.find((m: any) => m.id === editingMatchId)?.loser === p;
             const isSelected = selectedWinner === p || isWinner || isLoser;
             const rating = eloRatings[p] || 1200;
             const rank = i + 1;

             return (
               <button 
                 key={p} 
                 onClick={() => handleStudentClick(p)}
                 className={`group flex items-center gap-4 p-5 rounded-[2.5rem] border-4 transition-all duration-300 relative overflow-hidden ${
                   isWinner ? 'bg-emerald-500 border-emerald-400 text-white ' :
                   isLoser ? 'bg-rose-500 border-rose-400 text-white ' :
                   selectedWinner === p ? 'bg-indigo-600 border-indigo-500 text-white ' :
                   'bg-white border-white hover:border-indigo-100 '
                 }`}
               >
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black  transition-colors ${
                   isSelected ? 'bg-white/20 border-white/20 text-white' : 
                   (rank === 1 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300')
                 }`}>
                   {rank}
                 </div>
                 <div className="flex flex-col items-start truncate flex-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Competitor</span>
                    <span className="font-black text-sm uppercase tracking-tighter truncate w-full text-left">{p}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Rating</span>
                    <span className="font-black text-lg tabular-nums tracking-tighter italic">{rating}</span>
                 </div>
               </button>
             );
           })}
        </div>
      </div>

      {/* History & Controls Sidebar */}
      <div className="w-full lg:w-[450px] flex flex-col gap-8 min-h-0">
        <div className="bg-slate-900 p-12 rounded-[4rem] border-4 border-slate-800  flex flex-col gap-10 relative overflow-hidden flex-1 min-h-0">
           <div className="tool-grid-bg-dark opacity-10 pointer-events-none" />
           
           <div className="flex items-center justify-between w-full relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                 <History size={20} className="text-indigo-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Match Stream</h4>
              </div>
              <div className="px-4 py-1 bg-white/10 rounded-full text-[10px] font-black tabular-nums text-white">
                 {eloHistory.length}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar relative z-10">
              <AnimatePresence mode="popLayout">
                {currentHistory.map((m: any) => {
                  const isEditing = editingMatchId === m.id;
                  return (
                    <motion.div 
                      key={m.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-6 rounded-[2.5rem] border-4 transition-all group relative cursor-pointer ${
                        isEditing ? 'bg-white/10 border-indigo-500 ' : 'bg-white/5 border-transparent hover:bg-white/[0.08]'
                      }`}
                      onClick={() => { if (!isEditing) { setEditingMatchId(m.id); setSelectedWinner(''); } }}
                    >
                       <div className="flex items-center justify-between gap-3 mb-6">
                          <div className={`flex-1 text-center p-3 rounded-2xl text-[10px] font-black uppercase truncate transition-all ${m.winner ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/20 border-white/5 animate-pulse'}`}>
                             {m.winner || 'PENDING'}
                          </div>
                          <Zap size={14} className="text-white/20" />
                          <div className={`flex-1 text-center p-3 rounded-2xl text-[10px] font-black uppercase truncate transition-all ${m.loser ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white/20 border-white/5 animate-pulse'}`}>
                             {m.loser || 'PENDING'}
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">
                             {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center gap-4">
                             {isEditing ? (
                               <div className="flex gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); deleteMatch(m.id); }} className="text-rose-400 hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); setEditingMatchId(null); }} className="text-white/40 hover:scale-110 transition-transform"><X size={18} /></button>
                               </div>
                             ) : (
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-emerald-400">+{m.winnerNew - m.winnerOld}</span>
                                  <span className="text-[10px] font-black text-rose-400">{m.loserNew - m.loserOld}</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
           </div>

           {totalPages > 1 && (
             <div className="flex items-center justify-between pt-6 border-t border-white/10 relative z-10 shrink-0">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20 text-white"><ChevronLeft size={20} /></button>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20 text-white"><ChevronRight size={20} /></button>
             </div>
           )}
        </div>

        <div className="p-10 bg-indigo-600 rounded-[4rem] text-white space-y-6  relative overflow-hidden shrink-0 mt-auto">
           <div className="tool-grid-bg opacity-10 pointer-events-none" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                 <Volume2 size={20} strokeWidth={3} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Theoretical Matrix</h4>
           </div>
           <p className="text-xs font-black leading-relaxed italic text-indigo-100 uppercase tracking-widest relative z-10">
             Elo algorithms mapped. <br/>
             Skill tiers stabilized.
           </p>
           <div className="flex justify-end relative z-10">
              <BrainCircuit size={24} className="text-white/20" />
           </div>
        </div>
      </div>
    </div>
  );
};

const ChampionNode = ({ winner }: { winner: string | null }) => (
  <div className="flex flex-col items-center gap-6 mb-16 italic">
    <div className="relative">
      <AnimatePresence mode="wait">
        {winner ? (
          <motion.div
            key="champion"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-40 h-40 rounded-[3.5rem] bg-slate-900 border-[12px] border-amber-400 flex items-center justify-center text-amber-400 -[0_48px_96px_-12px_rgba(251,191,36,0.4)] z-20"
          >
            <Crown size={80} fill="currentColor" strokeWidth={1} />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-16px] border-4 border-dashed border-amber-400/30 rounded-[4rem] pointer-events-none"
            />
          </motion.div>
        ) : (
          <div className="w-40 h-40 rounded-[3.5rem] bg-slate-50 border-[12px] border-slate-100 flex items-center justify-center text-slate-100">
             <Trophy size={80} strokeWidth={1} />
          </div>
        )}
      </AnimatePresence>
    </div>
    <div className="text-center space-y-3">
       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">Tournament Champion</span>
       <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
          {winner || "Awaiting Final"}
       </h2>
    </div>
  </div>
);

const MatchNode = ({ match, onSelectWinner, mirrored = false, isCenter = false }: any) => {
  const hasWinner = !!match.winner;

  return (
    <div className={`relative flex items-center italic ${mirrored ? 'flex-row-reverse' : ''}`}>
      <div className={`flex flex-col gap-3 p-3 bg-white rounded-[2.5rem] border-4 transition-all duration-500 min-w-[240px]   hover:-translate-y-1 ${hasWinner ? 'border-indigo-100' : 'border-white'}`}>
        {match.participants.map((player: string, i: number) => {
          const isWinner = match.winner === player;
          const isLoser = match.winner && player && match.winner !== player;
          const isEmpty = !player;

          return (
            <button
              key={i}
              onClick={() => player && onSelectWinner(match.id, player)}
              disabled={isEmpty || hasWinner}
              className={`group flex items-center justify-between p-4 rounded-2xl transition-all border-4 ${
                isWinner ? 'bg-emerald-500 border-emerald-400 text-white ' :
                isLoser ? 'bg-slate-50 border-transparent text-slate-300 opacity-60' :
                isEmpty ? 'bg-slate-50/50 border-dashed border-slate-100 text-slate-200' :
                'bg-white border-white text-slate-800 hover:border-indigo-100 hover:bg-indigo-50/50'
              }`}
            >
              <div className="flex items-center gap-4 truncate">
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${isWinner ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {match.seeds?.[i] || '?'}
                 </div>
                 <span className="font-black text-xs uppercase tracking-widest truncate">{player || "TBD"}</span>
              </div>
              {isWinner && <Check size={18} strokeWidth={4} />}
            </button>
          );
        })}
      </div>

      {/* Connection Lines */}
      {!isCenter && (
        <div className={`w-16 h-px bg-slate-200 relative ${mirrored ? 'mr-0' : 'ml-0'}`}>
           <div className={`absolute w-4 h-4 rounded-full bg-slate-200 -top-2 ${mirrored ? '-left-2' : '-right-2'}`} />
        </div>
      )}
    </div>
  );
};

// 7. Component
export const Tournaments = () => {
  const { settings } = useSettings();
  const { setHeaderActions, setHelpContent, setHasConfig, setOnConfigToggle, setOnReset, clearHeader, isConfigOpen, setIsConfigOpen } = useHeader();
  const [tournaments, setTournaments] = useLocalStorage('tournaments_list', []);
  const [activeTournamentId, setActiveTournamentId] = useLocalStorage('active_tournament_id', null);

  const [step, setStep] = useState('setup');
  const [tournamentType, setTournamentType] = useState('single');
  const [bracketSize, setBracketSize] = useState(16);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [zoom, setZoom] = useState(0.8);
  const [minZoom, setMinZoom] = useState(0.2);
  const bracketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tournamentIdCounter = useRef(0);

  useEffect(() => {
    if (tournamentIdCounter.current === 0) tournamentIdCounter.current = Date.now();
  }, []);

  const activeTournament = useMemo(() =>
    tournaments.find((t: any) => t.id === activeTournamentId),
    [tournaments, activeTournamentId]
  );

  const [prevTournamentId, setPrevTournamentId] = useState(activeTournamentId);
  if (activeTournamentId !== prevTournamentId) {
    setPrevTournamentId(activeTournamentId);
    if (activeTournament) {
      setTournamentType(activeTournament.type);
      setBracketSize(activeTournament.bracketSize || 16);
      setSelectedClassId(activeTournament.classId || '');
      setStep(activeTournament.step || 'setup');
    } else {
      setStep('setup');
    }
  }

  useEffect(() => {
    if (step === 'active' && bracketRef.current && containerRef.current && tournamentType !== 'elo') {
      const updateZoom = () => {
        if (!containerRef.current || !bracketRef.current) return;
        const containerWidth = containerRef.current.clientWidth - 100;
        const containerHeight = containerRef.current.clientHeight - 100;
        const bracketWidth = bracketRef.current.scrollWidth;
        const bracketHeight = bracketRef.current.scrollHeight;

        if (bracketWidth > 0 && bracketHeight > 0) {
          const fitZoom = Math.min(1.5, containerWidth / bracketWidth, containerHeight / bracketHeight);
          setMinZoom(fitZoom);
          setZoom(fitZoom);
        }
      };
      setTimeout(updateZoom, 300);
    }
  }, [step, activeTournamentId, activeTournament?.data?.numRounds, tournamentType]);

  const addTournament = useCallback(() => {
    let nextNum = 1;
    while (tournaments.map((t: any) => t.name).includes(`Tournament ${nextNum}`)) nextNum++;
    const newTournament = {
      id: (tournamentIdCounter.current++).toString(),
      name: `Tournament ${nextNum}`,
      type: 'single',
      step: 'setup',
      participants: [],
      bracketSize: 16,
      data: null,
      classId: settings.classes[0]?.id || ''
    };
    setTournaments([...tournaments, newTournament]);
    setActiveTournamentId(newTournament.id);
    audioEngine.playTick(settings.soundTheme);
  }, [tournaments, settings.classes, settings.soundTheme, setTournaments, setActiveTournamentId]);

  const generateSingleElimination = (players: (string | null)[]) => {
    const n = players.length;
    const numRounds = Math.ceil(Math.log2(n));
    const bracketSize = Math.pow(2, numRounds);
    const matches: any[] = [];
    for (let r = 0; r < numRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r + 1);
      for (let i = 0; i < matchesInRound; i++) {
        const side = r === numRounds - 1 ? 'center' : (i < matchesInRound / 2 ? 'left' : 'right');
        matches.push({
          id: `m-${r}-${i}`, round: r, participants: [null, null], seeds: [null, null],
          winner: null, nextMatchId: r === numRounds - 1 ? null : `m-${r + 1}-${Math.floor(i / 2)}`,
          position: i, side
        });
      }
    }
    const round0Matches = matches.filter(m => m.round === 0);
    for (let i = 0; i < bracketSize; i++) {
      const player = players[i] || null;
      const matchIndex = Math.floor(i / 2);
      const slotIndex = i % 2;
      round0Matches[matchIndex].participants[slotIndex] = player;
      round0Matches[matchIndex].seeds[slotIndex] = player ? i + 1 : null;
    }
    round0Matches.forEach(match => {
      if (match.participants[0] && !match.participants[1]) match.winner = match.participants[0];
      else if (!match.participants[0] && match.participants[1]) match.winner = match.participants[1];
    });
    let changed = true;
    while (changed) {
      changed = false;
      matches.forEach(match => {
        if (match.winner && match.nextMatchId) {
          const nextMatch = matches.find(m => m.id === match.nextMatchId);
          if (!nextMatch) return;
          if (nextMatch.participants[match.position % 2] !== match.winner) {
            nextMatch.participants[match.position % 2] = match.winner;
            changed = true;
          }
        }
      });
    }
    return { type: 'single', participants: players, matches, numRounds, bracketSize };
  };

  const generateDoubleElimination = (players: (string | null)[]) => {
    const n = players.length;
    const numRounds = Math.ceil(Math.log2(n));
    const bracketSize = Math.pow(2, numRounds);
    
    // Create Winners Bracket (same as single elimination)
    const winnersData = generateSingleElimination(players);
    const winnersMatches = winnersData.matches.map(m => ({ ...m, id: `w-${m.id}`, nextMatchId: m.nextMatchId ? `w-${m.nextMatchId}` : 'final', bracket: 'winners' }));
    
    // Create Losers Bracket
    const losersMatches: any[] = [];
    const numLoserRounds = (numRounds - 1) * 2;
    for (let r = 0; r < numLoserRounds; r++) {
      const matchesInRound = Math.pow(2, Math.floor((numLoserRounds - r - 1) / 2));
      for (let i = 0; i < matchesInRound; i++) {
        losersMatches.push({
          id: `l-${r}-${i}`, round: r, participants: [null, null], seeds: [null, null],
          winner: null, nextMatchId: r === numLoserRounds - 1 ? 'final' : `l-${r + 1}-${Math.floor(i / 2)}`,
          position: i, bracket: 'losers', side: i < matchesInRound / 2 ? 'left' : 'right'
        });
      }
    }

    // Final Match
    const finalMatch = {
      id: 'final', round: numRounds, participants: [null, null], seeds: [null, null],
      winner: null, nextMatchId: null, position: 0, side: 'center', bracket: 'final'
    };

    return { 
      type: 'double', 
      participants: players, 
      matches: [...winnersMatches, ...losersMatches, finalMatch], 
      numRounds: numRounds + 1, 
      bracketSize 
    };
  };

  const handleSelectWinner = (matchId: string, winnerName: string) => {
    audioEngine.playTick(settings.soundTheme);
    setTournaments((prev: any) => prev.map((t: any) => {
      if (t.id !== activeTournamentId) return t;
      const newMatches = JSON.parse(JSON.stringify(t.data.matches));
      const match = newMatches.find((m: any) => m.id === matchId);
      if (!match) return t;
      
      const loserName = match.participants.find((p: string | null) => p && p !== winnerName);
      match.winner = winnerName;

      // Move Winner
      if (match.nextMatchId) {
        const nextMatch = newMatches.find((m: any) => m.id === match.nextMatchId);
        if (nextMatch) {
          if (match.id === 'final') {
             // Grand Final winner is already set
          } else {
             nextMatch.participants[match.position % 2] = winnerName;
          }
        }
      }

      // Move Loser (Double Elimination only)
      if (t.type === 'double' && match.bracket === 'winners' && loserName) {
        const loserRound = match.round; 
        const loserTargetMatch = newMatches.find((m: any) => m.bracket === 'losers' && m.round === loserRound * 2 && m.participants.includes(null));
        if (loserTargetMatch) {
          const emptySlot = loserTargetMatch.participants.indexOf(null);
          if (emptySlot !== -1) loserTargetMatch.participants[emptySlot] = loserName;
        }
      }

      return { ...t, data: { ...t.data, matches: newMatches } };
    }));
  };

  const resetTournament = useCallback(() => {
    if (window.confirm('Reset all match results?')) {
      setTournaments((prev: any) => prev.map((t: any) => {
        if (t.id !== activeTournamentId) return t;
        if (t.type === 'elo') return { ...t, eloRatings: {}, eloHistory: [] };
        const newMatches = t.data.matches.map((match: any) => {
          const m = { ...match, winner: null };
          if (m.round > 0) m.participants = [null, null];
          return m;
        });
        return { ...t, data: { ...t.data, matches: newMatches } };
      }));
      audioEngine.playTick(settings.soundTheme);
    }
  }, [activeTournamentId, setTournaments, settings.soundTheme]);

  useEffect(() => {
    setHasConfig(true);
    setOnConfigToggle(() => () => setIsConfigOpen(prev => !prev));
    setOnReset(() => resetTournament);
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setHasConfig, setOnConfigToggle, setIsConfigOpen, setOnReset, activeTournamentId, resetTournament, setHelpContent, setTournaments]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        {step === 'active' && tournamentType !== 'elo' && (
          <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-xl border-2 border-slate-100 ">
            <Maximize2 size={14} className="text-slate-400" />
            <input type="range" min={minZoom} max="1.5" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-20 accent-indigo-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer" />
          </div>
        )}
        <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-100 ">
           <select 
            value={activeTournamentId || ''} 
            onChange={(e) => e.target.value === 'new' ? addTournament() : setActiveTournamentId(e.target.value)} 
            className="px-6 py-2 bg-transparent rounded-xl font-black text-[10px] text-slate-800 outline-none transition-all uppercase tracking-widest cursor-pointer"
           >
            <option value="" disabled>Active Session</option>
            {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="new" className="text-indigo-600 font-black">+ Initialize New</option>
           </select>
        </div>
      </div>
    );
  }, [activeTournamentId, tournaments, step, zoom, minZoom, tournamentType, setHeaderActions, addTournament, setActiveTournamentId]);

  const initiateTournament = () => {
    if (!selectedStudents.length && tournamentType !== 'elo') return;
    audioEngine.playTick(settings.soundTheme);
    const shuffled = shuffle([...selectedStudents]);
    
    if (tournamentType !== 'elo') {
      while (shuffled.length < bracketSize) shuffled.push(null);
    }

    setTournaments((prev: any) => prev.map((t: any) => {
      if (t.id !== activeTournamentId) return t;
      if (tournamentType === 'elo') {
        const classStudents = settings.classes.find(c => c.id === selectedClassId)?.students || [];
        return { ...t, step: 'active', type: 'elo', participants: classStudents, eloRatings: {}, eloHistory: [] };
      }
      
      if (tournamentType === 'double') {
        return { ...t, step: 'active', type: 'double', data: generateDoubleElimination(shuffled) };
      }

      return { ...t, step: 'active', type: tournamentType, data: generateSingleElimination(shuffled) };
    }));
  };

  return (
    <ToolPanel alignTop fluid baseWidth={1200} baseHeight={800}>
      <div className="flex w-full h-full gap-8 p-4 lg:p-8">

      {!activeTournament ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-12 bg-slate-50/50 rounded-[4rem] border-4 border-white  relative overflow-hidden group">
           <div className="tool-grid-bg opacity-20 pointer-events-none" />
           <div className="relative group/icon">
              <div className="absolute inset-0 bg-indigo-600 rounded-[4rem] blur-[80px] opacity-20" />
              <div className="relative w-48 h-48 rounded-[4rem] bg-slate-900 flex items-center justify-center text-indigo-400 border-[12px] border-slate-800  rotate-3">
                 <Trophy size={96} strokeWidth={1} />
              </div>
           </div>
           <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Apex Arena Registry</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-4">Initialize a new tournament bracket or skill matrix</p>
           </div>
           <button onClick={addTournament} className="h-20 px-16 bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em]  hover:bg-slate-900 transition-all active:scale-95 border-8 border-white">
              Initialize Protocol
           </button>
        </div>
      ) : step === 'setup' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 italic">
          {/* Setup Sidebar */}
          <SettingsPanel isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Tournament Settings">
            <div className="flex flex-col gap-8 relative z-20 h-full">
               <div className="bg-slate-900 p-8 rounded-[3rem] border-4 border-slate-800 flex flex-col gap-8 shrink-0">

               <div className="space-y-10 relative z-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ml-1">Format Logic</label>
                     <div className="grid grid-cols-1 gap-3">
                        {[
                          { id: 'single', label: 'Single Elimination', icon: Layout },
                          { id: 'double', label: 'Double Elimination', icon: ListIcon },
                          { id: 'elo', label: 'Elo Skill System', icon: TrendingUp }
                        ].map(type => (
                          <button 
                            key={type.id} 
                            onClick={() => setTournamentType(type.id)} 
                            className={`p-6 rounded-[2rem] border-4 font-black text-[11px] transition-all flex items-center justify-between ${tournamentType === type.id ? 'bg-indigo-600 border-indigo-400 text-white ' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                          >
                             <div className="flex items-center gap-4">
                                <type.icon size={20} strokeWidth={3} />
                                <span className="uppercase tracking-[0.2em]">{type.label}</span>
                             </div>
                             {tournamentType === type.id && <Check size={18} strokeWidth={4} />}
                          </button>
                        ))}
                     </div>
                  </div>

                  {tournamentType !== 'elo' && (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ml-1">Bracket Resolution</label>
                       <div className="grid grid-cols-3 gap-3">
                          {[4, 8, 16].map(size => (
                            <button 
                              key={size} 
                              onClick={() => setBracketSize(size)}
                              className={`p-5 rounded-2xl border-4 font-black text-lg transition-all ${bracketSize === size ? 'bg-indigo-600 border-indigo-400 text-white ' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                            >
                               {size}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}
  
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ml-1">Candidate Registry</label>
                     <div className="relative">
                        <select 
                          value={selectedClassId} 
                          onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            setSelectedStudents([]);
                          }} 
                          className="w-full h-16 px-8 bg-white/5 border-4 border-transparent rounded-[1.5rem] text-sm font-black text-white outline-none focus:bg-white/10 focus:border-indigo-400 transition-all uppercase tracking-widest appearance-none"
                        >
                           {settings.classes.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                           <ChevronDown size={20} />
                        </div>
                     </div>
                  </div>
               </div>
  
               <button 
                 onClick={initiateTournament} 
                 disabled={tournamentType !== 'elo' && selectedStudents.length < 2}
                 className="w-full h-24 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg  hover:bg-white hover:text-indigo-600 transition-all active:scale-95 border-8 border-white/5 disabled:opacity-20 disabled:grayscale"
               >
                  <Play size={24} fill="currentColor" className="inline mr-4" /> Start Protocol
               </button>
            </div>
          </div>
          </SettingsPanel>
  
          {/* Main Setup View */}
          <div className="flex-1 bg-slate-50/50 p-12 rounded-[4rem] border-4 border-white  flex flex-col gap-10 relative overflow-hidden group">
             <div className="tool-grid-bg opacity-20 pointer-events-none" />
             
             <div className="flex items-center justify-between shrink-0 border-b-4 border-white pb-8 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white ">
                      <Users size={28} strokeWidth={3} />
                   </div>
                   <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Candidate Selection</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Populating Active Stream</span>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const all = settings.classes.find(c => c.id === selectedClassId)?.students || [];
                          setSelectedStudents(all);
                          audioEngine.playTick(settings.soundTheme);
                        }}
                        className="px-6 py-3 bg-white border-4 border-white  hover:border-indigo-100 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all"
                      >
                        All Candidates
                      </button>
                      <button 
                        onClick={() => {
                          const all = settings.classes.find(c => c.id === selectedClassId)?.students || [];
                          const shuffled = [...all].sort(() => 0.5 - Math.random());
                          setSelectedStudents(shuffled.slice(0, bracketSize));
                          audioEngine.playTick(settings.soundTheme);
                        }}
                        className="px-6 py-3 bg-white border-4 border-white  hover:border-indigo-100 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all"
                      >
                        Random {bracketSize}
                      </button>
                   </div>
                   <div className="h-14 px-8 bg-indigo-600 rounded-full flex items-center justify-center text-[11px] font-black text-white uppercase tracking-[0.2em]  border-4 border-white">
                      {selectedStudents.length} / {bracketSize} Selected
                   </div>
                </div>
             </div>

             <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 no-scrollbar relative z-10 pb-8">
                {(settings.classes.find(c => c.id === selectedClassId)?.students || []).map((s, i) => {
                  const isSelected = selectedStudents.includes(s);
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStudents(prev => prev.filter(name => name !== s));
                        } else if (selectedStudents.length < bracketSize || tournamentType === 'elo') {
                          setSelectedStudents(prev => [...prev, s]);
                        }
                        audioEngine.playTick(settings.soundTheme);
                      }}
                      className={`p-6 rounded-[2.5rem] border-4 transition-all group/item flex items-center gap-4 ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white ' : 'bg-white border-white hover:border-indigo-100  text-slate-800'}`}
                    >
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300'}`}>{i+1}</div>
                       <span className="text-sm font-black uppercase tracking-tight truncate flex-1 text-left">{s}</span>
                       {isSelected && <Check size={18} strokeWidth={4} />}
                    </button>
                  );
                })}
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 italic">
           {tournamentType === 'elo' ? (
             <EloManager 
              participants={activeTournament.participants}
              eloRatings={activeTournament.eloRatings || {}}
              setEloRatings={(r: any) => setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, eloRatings: typeof r === 'function' ? r(t.eloRatings || {}) : r } : t))}
              eloHistory={activeTournament.eloHistory || []}
              setEloHistory={(h: any) => setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, eloHistory: typeof h === 'function' ? h(t.eloHistory || []) : h } : t))}
             />
           ) : (
             <div ref={containerRef} className="flex-1 overflow-auto bg-slate-50/50 rounded-[4rem] border-4 border-white  relative no-scrollbar">
               <motion.div 
                 ref={bracketRef} 
                 style={{ scale: zoom, transformOrigin: 'top left' }} 
                 className="p-32 transition-all duration-300 ease-out inline-flex flex-col items-center min-w-full min-h-full"
               >
                 <ChampionNode winner={activeTournament.data?.matches?.find((m: any) => m.id === 'final' || (m.side === 'center' && activeTournament.type !== 'double'))?.winner} />
                 
                 {activeTournament.type === 'double' ? (
                   <div className="flex flex-col gap-40">
                      {/* Winners Bracket */}
                      <div className="flex flex-col items-center gap-12">
                        <div className="flex items-center gap-6 bg-slate-900 px-10 py-4 rounded-3xl border-4 border-slate-800 ">
                           <Shield size={24} className="text-indigo-400" />
                           <h3 className="text-xl font-black text-white uppercase tracking-[0.4em]">Winners Sector</h3>
                        </div>
                        <div className="flex gap-0 items-center justify-center">
                          {Array.from({ length: activeTournament.data.numRounds - 1 }).map((_, rIdx) => (
                            <div key={`W-${rIdx}`} className="flex flex-col h-full justify-center">
                              <div className="flex-1 flex flex-col justify-around">
                                {activeTournament.data?.matches?.filter((m: any) => m.round === rIdx && m.bracket === 'winners').map((m: any) => (
                                  <div key={m.id} className="px-16 py-12 relative"><MatchNode match={m} onSelectWinner={handleSelectWinner} round={rIdx} /></div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Losers Bracket */}
                      <div className="flex flex-col items-center gap-12">
                        <div className="flex items-center gap-6 bg-white px-10 py-4 rounded-3xl border-4 border-white ">
                           <Activity size={24} className="text-rose-500" />
                           <h3 className="text-xl font-black text-slate-800 uppercase tracking-[0.4em]">Recovery Sector</h3>
                        </div>
                        <div className="flex gap-0 items-center justify-center">
                          {Array.from({ length: (activeTournament.data.numRounds - 2) * 2 }).map((_, rIdx) => (
                            <div key={`L-${rIdx}`} className="flex flex-col h-full justify-center">
                              <div className="flex-1 flex flex-col justify-around">
                                {activeTournament.data?.matches?.filter((m: any) => m.round === rIdx && m.bracket === 'losers').map((m: any) => (
                                  <div key={m.id} className="px-16 py-12 relative"><MatchNode match={m} onSelectWinner={handleSelectWinner} round={rIdx} /></div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Grand Final */}
                      <div className="flex flex-col items-center gap-12">
                         <div className="h-20 px-12 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white border-8 border-white ">
                            <h3 className="text-2xl font-black uppercase tracking-[0.6em]">Apex Final</h3>
                         </div>
                         {activeTournament.data?.matches?.filter((m: any) => m.id === 'final').map((m: any) => (
                           <MatchNode key={m.id} match={m} onSelectWinner={handleSelectWinner} isCenter round={activeTournament.data.numRounds - 1} />
                         ))}
                      </div>
                   </div>
                 ) : (
                   <div className="flex gap-0 min-w-max items-center justify-center">
                      {/* Left Brackets */}
                      {Array.from({ length: Math.max(0, (activeTournament.data?.numRounds || 1) - 1) }).map((_, rIdx) => (
                        <div key={`L-${rIdx}`} className="flex flex-col h-full min-h-[700px] justify-center">
                          <span className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-6">Sector L-{rIdx + 1}</span>
                          <div className="flex-1 flex flex-col justify-around">
                            {activeTournament.data?.matches?.filter((m: any) => m.round === rIdx && m.side === 'left').map((m: any) => (
                              <div key={m.id} className="px-16 py-12 relative"><MatchNode match={m} onSelectWinner={handleSelectWinner} round={rIdx} /></div>
                            ))}
                          </div>
                        </div>
                      ))}
  
                      {/* Center Final */}
                      <div className="flex flex-col items-center justify-center px-24 relative min-h-[700px]">
                         <div className="px-10 py-3 bg-indigo-600 rounded-full text-white mb-10  border-4 border-white">
                            <span className="text-center text-[11px] font-black uppercase tracking-[0.6em]">Apex Terminal</span>
                         </div>
                         {activeTournament.data?.matches?.filter((m: any) => m.side === 'center').map((m: any) => (
                           <MatchNode key={m.id} match={m} onSelectWinner={handleSelectWinner} isCenter round={activeTournament.data.numRounds - 1} />
                         ))}
                      </div>
  
                      {/* Right Brackets */}
                      {Array.from({ length: Math.max(0, (activeTournament.data?.numRounds || 1) - 1) }).reverse().map((_, revIdx, arr) => {
                        const rIdx = arr.length - 1 - revIdx;
                        return (
                          <div key={`R-${rIdx}`} className="flex flex-col h-full min-h-[700px] justify-center">
                            <span className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-6">Sector R-{rIdx + 1}</span>
                            <div className="flex-1 flex flex-col justify-around">
                              {activeTournament.data?.matches?.filter((m: any) => m.round === rIdx && m.side === 'right').map((m: any) => (
                                <div key={m.id} className="px-16 py-12 relative"><MatchNode match={m} onSelectWinner={handleSelectWinner} mirrored round={rIdx} /></div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                 )}
               </motion.div>
             </div>
           )}
        </div>
      )}
      </div>
    </ToolPanel>
  );
};

export default Tournaments;
