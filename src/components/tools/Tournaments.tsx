import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  Trophy, 
  Users, 
  Play, 
  RotateCcw, 
  ChevronDown,
  Sparkles,
  Users2,
  Trash2, 
  Plus, 
  Shuffle,   List as ListIcon, 
  Settings, 
  X,
  Shield, 
  TrendingUp, 
  Check, 
  MousePointer2, 
  ChevronUp,
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
  Volume2,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { ClassPanel } from '../shared/ClassPanel';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
// Custom Bracket Implementation
// 1. Constants
const K_FACTOR = 32;
const BASE_RATING = 1200;

// Bracket Helpers
const getNextPowerOfTwo = (n: number) => {
  let power = 2;
  while (power < n) power *= 2;
  return power;
};

const generateSingleElimination = (players: string[]) => {
  const count = players.length;
  const size = getNextPowerOfTwo(count);
  const matches: any[] = [];
  const matchIds: any[] = [];
  
  // Round 1
  const round1Count = size / 2;
  for (let i = 0; i < round1Count; i++) {
    const matchId = `r1-m${i}`;
    matchIds.push(matchId);
    const p1 = players[i * 2] || null;
    const p2 = players[i * 2 + 1] || null;
    matches.push({
      id: matchId,
      nextMatchId: null,
      tournamentRoundText: '1',
      state: (p1 && p2) ? 'SCHEDULED' : 'DONE',
      participants: [
        { id: p1 || 'bye', name: p1 || '-', isWinner: p1 && !p2, resultText: p1 && !p2 ? 'ADVANCED' : '' },
        { id: p2 || 'bye', name: p2 || '-', isWinner: !p1 && p2, resultText: !p1 && p2 ? 'ADVANCED' : '' }
      ]
    });
  }

  let currentRoundMatchIds = matchIds;
  let round = 2;
  while (currentRoundMatchIds.length > 1) {
    const nextRoundMatchIds = [];
    for (let i = 0; i < currentRoundMatchIds.length; i += 2) {
      const matchId = `r${round}-m${i / 2}`;
      nextRoundMatchIds.push(matchId);
      const m1 = matches.find(m => m.id === currentRoundMatchIds[i]);
      const m2 = matches.find(m => m.id === currentRoundMatchIds[i + 1]);
      if (m1) m1.nextMatchId = matchId;
      if (m2) m2.nextMatchId = matchId;
      matches.push({
        id: matchId,
        nextMatchId: null,
        tournamentRoundText: round.toString(),
        state: 'SCHEDULED',
        participants: [{ id: '', name: 'TBD' }, { id: '', name: 'TBD' }]
      });
    }
    currentRoundMatchIds = nextRoundMatchIds;
    round++;
  }
  return matches;
};

const generateDoubleElimination = (players: string[]) => {
  const count = players.length;
  const size = getNextPowerOfTwo(count);
  const matches: any[] = [];
  
  // 1. Winners Bracket
  const winnersMatches = generateSingleElimination(players);
  winnersMatches.forEach(m => {
    m.id = `W-${m.id}`;
    m.nextMatchId = m.nextMatchId ? `W-${m.nextMatchId}` : 'GF-1';
    m.tournamentRoundText = `W${m.tournamentRoundText}`;
    // Flag losers to go to Losers bracket
    const roundIdx = parseInt(m.tournamentRoundText.replace('W', '')) - 1;
    m.loserNextMatchId = `L-R${roundIdx + 1}-M${Math.floor(parseInt(m.id.split('-m')[1]) / 2)}`;
  });
  matches.push(...winnersMatches);

  // 2. Losers Bracket
  const winnersRoundsCount = Math.log2(size);
  const losersMatchIds: Record<string, string[]> = {};
  
  for (let r = 1; r < winnersRoundsCount; r++) {
    const lRound = `L${r}`;
    losersMatchIds[lRound] = [];
    const count = size / Math.pow(2, r + 1);
    
    for (let i = 0; i < count; i++) {
      const id = `L-R${r}-M${i}`;
      losersMatchIds[lRound].push(id);
      matches.push({
        id,
        nextMatchId: null,
        tournamentRoundText: lRound,
        state: 'SCHEDULED',
        participants: [{ id: '', name: 'TBD' }, { id: '', name: 'TBD' }]
      });
    }
  }

  // Link Losers
  Object.keys(losersMatchIds).forEach((lRound, idx) => {
    const currentIds = losersMatchIds[lRound];
    const nextRoundKey = `L${idx + 2}`;
    const nextIds = losersMatchIds[nextRoundKey];
    if (nextIds) {
      currentIds.forEach((id, i) => {
        const m = matches.find(match => match.id === id);
        if (m) m.nextMatchId = nextIds[Math.floor(i / 2)];
      });
    } else {
      currentIds.forEach(id => {
        const m = matches.find(match => match.id === id);
        if (m) m.nextMatchId = 'GF-1';
      });
    }
  });

  // 3. Grand Final
  matches.push({
    id: 'GF-1',
    nextMatchId: null,
    tournamentRoundText: 'Final',
    state: 'SCHEDULED',
    participants: [{ id: '', name: 'TBD' }, { id: '', name: 'TBD' }]
  });

  return matches;
};

// 3. Text (Help and Info)
const HELP_INFO = (
  <div className="space-y-4 font-['Outfit']">
    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tournament Rules</h3>
    <div className="space-y-3">
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary shrink-0">1</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick your players in the setup screen.</p>
      </div>
      <div className="flex gap-3 text-left">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
        <p className="text-sm text-slate-600 font-medium leading-tight">Pick a winner and a loser to see who is the best.</p>
      </div>
    </div>
  </div>
);

const EloManager = ({ participants, eloRatings, setEloRatings, eloHistory, setEloHistory, onBack, isMobile }: any) => {
  const [selectedWinner, setSelectedWinner] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const { settings } = useSettings();
  const matchIdCounter = useRef(0);
  const exportRef = useRef<HTMLDivElement>(null);

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
      return { ...m, winnerOld: rW, winnerNew: nW, loserOld: rL, loserNew: nL };
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
      winner, loser, winnerOld: rW, winnerNew: nW, loserOld: rL, loserNew: nL,
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
      if (match.winner === student) newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, winner: null } : m);
      else if (match.loser === student) newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, loser: null } : m);
      else if (!match.winner) newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, winner: student } : m);
      else if (!match.loser) newHistory = eloHistory.map((m: any) => m.id === editingMatchId ? { ...m, loser: student } : m);
      else return;
      recalculateAll(newHistory);
      const updatedMatch = newHistory.find((m: any) => m.id === editingMatchId);
      if (updatedMatch.winner && updatedMatch.loser) setEditingMatchId(null);
      return;
    }
    // Two-step selection: first click = winner (green), second click = loser (red)
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
  
  const leaderboardItemsPerPage = isMobile ? 6 : 15;
  const totalLeaderboardPages = Math.ceil(sortedParticipants.length / leaderboardItemsPerPage);
  const currentLeaderboardParticipants = sortedParticipants.slice((leaderboardPage - 1) * leaderboardItemsPerPage, leaderboardPage * leaderboardItemsPerPage);

  const orderedHistory = [...eloHistory];
  const historyItemsPerPage = isMobile ? 1 : 15;
  const totalHistoryPages = Math.ceil(orderedHistory.length / historyItemsPerPage);
  const currentHistory = orderedHistory.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage);
  const matchOffset = (historyPage - 1) * historyItemsPerPage;

  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Rating'];
    const rows = sortedParticipants.map((p, i) => [i + 1, p, eloRatings[p] || 1200]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leaderboard-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    audioEngine.playTick(settings.soundTheme);
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-4 h-full min-h-0 italic">
      {/* Best Players Panel */}
      <div ref={exportRef} className="flex-1 bg-surface rounded-[2rem] border-4 border-white flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b-4 border-slate-50 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-neutral-400 hover:text-primary hover:bg-surface transition-all active:scale-90"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <Trophy size={18} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Leaderboard</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-8 py-4 rounded-xl bg-primary border-2 border-indigo-600 text-white hover:bg-dark-bg hover:border-slate-900 transition-all flex items-center gap-3 text-xl font-black uppercase tracking-widest"
              title="Export as CSV"
            >
              <FileSpreadsheet size={24} strokeWidth={3} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="p-2 lg:p-4 grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 overflow-y-auto no-scrollbar flex-1">
          {currentLeaderboardParticipants.map((p: string) => {
            const isEditWinner = eloHistory.find((m: any) => m.id === editingMatchId)?.winner === p;
            const isEditLoser = eloHistory.find((m: any) => m.id === editingMatchId)?.loser === p;
            const isPendingWinner = !editingMatchId && selectedWinner === p;
            const rating = eloRatings[p] || 1200;
            const rank = sortedParticipants.indexOf(p) + 1;

            return (
              <button 
                key={p} 
                onClick={() => handleStudentClick(p)} 
                className={`flex flex-col items-center justify-center p-3 lg:p-4 rounded-[1.25rem] lg:rounded-[1.5rem] border-2 lg:border-2 transition-all duration-200 relative ${
                  isEditWinner 
                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                    : isEditLoser 
                      ? 'bg-rose-500 border-rose-400 text-white' 
                      : isPendingWinner
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'bg-slate-50 border-white hover:border-primary/20 hover:bg-surface'
                }`}
              >
                <div className={`absolute top-2 left-2 w-7 h-7 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-[10px] lg:text-[8px] font-black ${
                  (isEditWinner || isEditLoser || isPendingWinner) ? 'bg-surface/20 text-white' : 'bg-surface text-neutral-400 shadow-sm'
                }`}>
                  #{rank}
                </div>
                <span className={`text-3xl lg:text-2xl font-black tabular-nums leading-none mb-1 ${
                  (isEditWinner || isEditLoser || isPendingWinner) ? 'text-white' : 'text-slate-800'
                }`}>{rating}</span>
                <span className={`font-black text-lg lg:text-base uppercase tracking-widest truncate w-full text-center ${
                  (isEditWinner || isEditLoser || isPendingWinner) ? 'text-white/80' : 'text-slate-500'
                }`}>{p}</span>
              </button>
            );
          })}
        </div>

        {/* Leaderboard Paging */}
        <div className="px-4 py-2 bg-slate-50/50 border-t-2 border-slate-50 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))} 
            disabled={leaderboardPage === 1} 
            className="p-2 bg-surface border-2 border-slate-100 rounded-lg disabled:opacity-20 text-neutral-400 hover:text-primary hover:border-primary/20 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{leaderboardPage} / {Math.max(1, totalLeaderboardPages)}</span>
          <button 
            onClick={() => setLeaderboardPage(p => Math.min(Math.max(1, totalLeaderboardPages), p + 1))} 
            disabled={leaderboardPage >= Math.max(1, totalLeaderboardPages)} 
            className="p-2 bg-surface border-2 border-slate-100 rounded-lg disabled:opacity-20 text-neutral-400 hover:text-primary hover:border-primary/20 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Match History Panel */}
      <div className="w-full lg:w-[380px] bg-surface rounded-[2rem] border-4 border-white flex flex-col overflow-hidden shrink-0">
        <div className="px-4 py-2 flex items-center justify-between border-b-2 border-slate-50 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
              <History size={16} strokeWidth={3} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">History</h4>
          </div>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{eloHistory.length} matches</span>
        </div>

        <div className="px-3 py-2 flex-1 overflow-y-auto no-scrollbar relative z-10">
          {/* Column headers */}
          <div className="grid grid-cols-[1.5rem_1fr_auto_1fr_auto] gap-1 px-1 mb-1 items-center">
            <span className="text-[7px] font-black text-slate-300 uppercase text-center">#</span>
            <span className="text-[7px] font-black text-emerald-400 uppercase text-center">Winner</span>
            <span />
            <span className="text-[7px] font-black text-rose-400 uppercase text-center">Loser</span>
            <span />
          </div>
          <AnimatePresence mode="popLayout">
            {currentHistory.map((m: any, rowIdx: number) => {
              const matchNum = matchOffset + rowIdx + 1;
              const isEditing = editingMatchId === m.id;
              return (
                <motion.div 
                  key={m.id} 
                  layout 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className={`grid grid-cols-[1.5rem_1fr_auto_1fr_auto] gap-1 items-center px-1 py-1 rounded-xl border-2 mb-1 cursor-pointer transition-all ${
                    isEditing ? 'bg-primary/5 border-primary/30' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                  }`}
                  onClick={() => { if (!isEditing) { setEditingMatchId(m.id); setSelectedWinner(''); } }}
                >
                  <span className="text-sm lg:text-[7px] font-black text-slate-300 text-center">{matchNum}</span>
                  <div className={`text-center px-2 py-1.5 lg:px-1 lg:py-0.5 rounded-lg text-sm lg:text-[7px] font-black uppercase truncate ${
                    m.winner ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-300 animate-pulse'
                  }`}>{m.winner || '?'}</div>
                  <Zap size={isMobile ? 18 : 8} className="text-slate-200 shrink-0" />
                  <div className={`text-center px-2 py-1.5 lg:px-1 lg:py-0.5 rounded-lg text-sm lg:text-[7px] font-black uppercase truncate ${
                    m.loser ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-300 animate-pulse'
                  }`}>{m.loser || '?'}</div>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); deleteMatch(m.id); }} className="p-1 lg:p-0.5 hover:bg-caution-bg rounded text-rose-400 transition-colors"><Trash2 size={isMobile ? 18 : 10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingMatchId(null); }} className="p-1 lg:p-0.5 hover:bg-slate-100 rounded text-slate-300 transition-colors"><X size={isMobile ? 18 : 10} /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-0.5">
                      {m.winnerNew !== undefined && <span className="text-xs lg:text-[6px] font-black text-emerald-500">+{m.winnerNew - m.winnerOld}</span>}
                      {m.loserNew !== undefined && <span className="text-xs lg:text-[6px] font-black text-rose-400">{m.loserNew - m.loserOld}</span>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Paging - always visible when there are matches */}
        <div className="px-3 py-2 bg-slate-50/50 border-t-2 border-slate-50 flex items-center justify-between shrink-0">
          <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="p-1.5 bg-surface border-2 border-slate-100 rounded-lg disabled:opacity-20 text-neutral-400 hover:text-primary hover:border-primary/20 transition-all"><ChevronLeft size={12} /></button>
          <span className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em]">{historyPage} / {Math.max(1, totalHistoryPages)}</span>
          <button onClick={() => setHistoryPage(p => Math.min(Math.max(1, totalHistoryPages), p + 1))} disabled={historyPage >= Math.max(1, totalHistoryPages)} className="p-1.5 bg-surface border-2 border-slate-100 rounded-lg disabled:opacity-20 text-neutral-400 hover:text-primary hover:border-primary/20 transition-all"><ChevronRight size={12} /></button>
        </div>
      </div>
    </div>
  );
};

const BracketManager = ({ tournament, setTournaments, activeTournamentId, onBack }: any) => {
  const { settings } = useSettings();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const [matchPositions, setMatchPositions] = useState<Record<string, { x: number, y: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const roundsRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const matches = useMemo(() => tournament.matches || [], [tournament.matches]);

  const handleExport = async () => {
    if (!roundsRef.current) return;
    try {
      const el = roundsRef.current;
      
      // Calculate the actual content size to avoid the massive p-80 padding in the export
      // We target the inner container to get a tighter crop
      const contentEl = el.querySelector('.flex.gap-60');
      const targetEl = (contentEl as HTMLElement) || el;

      const dataUrl = await htmlToImage.toPng(targetEl, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2,
        style: {
          transform: 'none',
          padding: '60px', // Controlled padding for the export
          margin: '0'
        }
      });

      const link = document.createElement('a');
      link.download = `tournament-${tournament.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      audioEngine.playTick(settings.soundTheme);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const updatePositions = useCallback(() => {
    const positions: Record<string, { x: number, y: number }> = {};
    const root = roundsRef.current;
    if (!root) return;

    Object.entries(matchRefs.current).forEach(([id, el]) => {
      if (el) {
        let curr = el as HTMLElement;
        let px = curr.offsetWidth / 2;
        let py = curr.offsetHeight / 2;
        
        while (curr && curr !== root) {
          px += curr.offsetLeft;
          py += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement;
        }
        positions[id] = { x: px, y: py };
      }
    });
    setMatchPositions(positions);
  }, []);

  const zoomToFitAll = useCallback(() => {
    const container = containerRef.current;
    const rounds = roundsRef.current;
    if (!container || !rounds) return;

    // Wait for layout to settle
    setTimeout(() => {
      const rw = rounds.offsetWidth;
      const rh = rounds.offsetHeight;
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;

      const targetScale = Math.min(Math.max(Math.min((cw * 0.9) / rw, (ch * 0.9) / rh), 0.1), 1.5);
      
      animate(scale, targetScale, { type: 'spring', damping: 25, stiffness: 200 });
      animate(x, (cw / 2) - (rw / 2 * targetScale), { type: 'spring', damping: 25, stiffness: 200 });
      animate(y, (ch / 2) - (rh / 2 * targetScale), { type: 'spring', damping: 25, stiffness: 200 });
    }, 100);
  }, [scale, x, y]);

  useLayoutEffect(() => {
    updatePositions();
    zoomToFitAll();
    const timer = setTimeout(updatePositions, 500);
    window.addEventListener('resize', updatePositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions, tournament.id, matches, zoomToFitAll]);
  
  const { rounds, roundMap } = useMemo(() => {
    const rounds: any[][] = [];
    const roundMap: Record<string, number> = {};
    let nextRoundIdx = 0;

    matches.forEach((m: any) => {
      const text = m.tournamentRoundText;
      if (roundMap[text] === undefined) {
        roundMap[text] = nextRoundIdx++;
      }
      const idx = roundMap[text];
      if (!rounds[idx]) rounds[idx] = [];
      rounds[idx].push(m);
    });
    return { rounds, roundMap };
  }, [matches]);

  const jumpToRound = useCallback((roundIdx: number, wing?: 'left' | 'right' | 'center') => {
    let roundMatches = rounds[roundIdx];
    if (!roundMatches || roundMatches.length === 0) return;
    
    if (wing === 'left' && roundIdx < rounds.length - 1) {
      roundMatches = roundMatches.slice(0, Math.ceil(roundMatches.length / 2));
    } else if (wing === 'right' && roundIdx < rounds.length - 1) {
      roundMatches = roundMatches.slice(Math.ceil(roundMatches.length / 2));
    }

    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, count = 0;
    
    roundMatches.forEach(m => {
      const pos = matchPositions[m.id];
      if (pos) {
        sumX += pos.x;
        minY = Math.min(minY, pos.y - 150); 
        maxY = Math.max(maxY, pos.y + 150);
        count++;
      }
    });
    
    if (count === 0) return;

    const avgX = sumX / count;
    const roundHeight = maxY - minY;
    const container = containerRef.current;
    if (!container) return;

    const targetScale = Math.min(Math.max((container.offsetHeight * 0.8) / roundHeight, 0.15), 1.5);
    const midY = (minY + maxY) / 2;

    // Center the target point in the viewport
    animate(scale, targetScale, { type: 'spring', damping: 25, stiffness: 200 });
    animate(x, (container.offsetWidth / 2) - (avgX * targetScale), { type: 'spring', damping: 25, stiffness: 200 });
    animate(y, (container.offsetHeight / 2) - (midY * targetScale), { type: 'spring', damping: 25, stiffness: 200 });
    
    audioEngine.playTick(settings.soundTheme);
  }, [rounds, matchPositions, scale, x, y, settings.soundTheme]);

  const navigationButtons = useMemo(() => {
    if (tournament.type === 'double') {
      const winnersRounds = rounds.filter((rm, i) => Object.keys(roundMap)[i].startsWith('W'));
      const losersRounds = rounds.filter((rm, i) => Object.keys(roundMap)[i].startsWith('L'));
      const finalRound = rounds.filter((rm, i) => Object.keys(roundMap)[i] === 'Final');

      return [
        ...winnersRounds.map((rm) => ({
          label: rm[0].tournamentRoundText,
          onClick: () => jumpToRound(roundMap[rm[0].tournamentRoundText], 'center'),
          color: 'bg-surface text-success hover:text-emerald-700'
        })),
        ...finalRound.map(() => ({
          label: 'Final',
          onClick: () => jumpToRound(roundMap['Final'], 'center'),
          color: 'bg-primary text-white hover:bg-primary/90 shadow-md'
        })),
        ...losersRounds.map((rm) => ({
          label: rm[0].tournamentRoundText,
          onClick: () => jumpToRound(roundMap[rm[0].tournamentRoundText], 'center'),
          color: 'bg-surface text-caution hover:text-rose-700'
        })).reverse()
      ];
    } else {
      // Single elimination - split layout
      const wingRounds = rounds.slice(0, -1);
      return [
        ...wingRounds.map((rm, idx) => ({
          label: `L${idx + 1}`,
          onClick: () => jumpToRound(idx, 'left'),
          color: 'bg-surface text-success hover:text-emerald-700'
        })),
        {
          label: 'Final',
          onClick: () => jumpToRound(rounds.length - 1, 'center'),
          color: 'bg-primary text-white hover:bg-primary/90 shadow-md'
        },
        ...wingRounds.map((rm, idx) => ({
          label: `R${idx + 1}`,
          onClick: () => jumpToRound(idx, 'right'),
          color: 'bg-surface text-caution hover:text-rose-700'
        })).reverse()
      ];
    }
  }, [tournament.type, rounds, roundMap, jumpToRound]);

  const updateWinner = (matchId: string, winnerId: string) => {
    audioEngine.playTick(settings.soundTheme);
    setTournaments((prev: any) => {
      const updatedTournaments = prev.map((t: any) => {
        if (t.id !== activeTournamentId) return t;
        
        const newMatches = [...t.matches];
        const matchIndex = newMatches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) return t;

        const match = { ...newMatches[matchIndex] };
        match.participants = match.participants.map((p: any) => ({
          ...p,
          isWinner: p.id === winnerId,
          resultText: p.id === winnerId ? 'WON' : (winnerId ? 'LOST' : '')
        }));
        match.state = winnerId ? 'DONE' : 'SCHEDULED';
        newMatches[matchIndex] = match;

        if (match.nextMatchId) {
          const nextMatchIndex = newMatches.findIndex(m => m.id === match.nextMatchId);
          if (nextMatchIndex !== -1) {
            const nextMatch = { ...newMatches[nextMatchIndex], participants: [...newMatches[nextMatchIndex].participants] };
            const existingIndex = nextMatch.participants.findIndex((p: any) => p.sourceMatchId === matchId);
            
            if (existingIndex !== -1) {
              nextMatch.participants[existingIndex] = { ...nextMatch.participants[existingIndex], id: winnerId, name: winnerId || 'TBD' };
            } else {
              const emptySlotIndex = nextMatch.participants.findIndex((p: any) => !p.id || p.id === 'bye');
              if (emptySlotIndex !== -1) {
                nextMatch.participants[emptySlotIndex] = { ...nextMatch.participants[emptySlotIndex], id: winnerId, name: winnerId || 'TBD', sourceMatchId: matchId };
              }
            }
            newMatches[nextMatchIndex] = nextMatch;
          }
        }

        // Handle Loser Advancement for Double Elimination
        if (match.loserNextMatchId) {
          const loserId = match.participants.find(p => p.id !== winnerId)?.id;
          if (loserId && loserId !== 'bye') {
            const nextMatchIndex = newMatches.findIndex(m => m.id === match.loserNextMatchId);
            if (nextMatchIndex !== -1) {
              const nextMatch = { ...newMatches[nextMatchIndex], participants: [...newMatches[nextMatchIndex].participants] };
              const existingIndex = nextMatch.participants.findIndex((p: any) => p.sourceMatchId === `${matchId}-loser`);
              
              if (existingIndex !== -1) {
                nextMatch.participants[existingIndex] = { ...nextMatch.participants[existingIndex], id: loserId, name: loserId || 'TBD' };
              } else {
                const emptySlotIndex = nextMatch.participants.findIndex((p: any) => !p.id || p.id === 'bye');
                if (emptySlotIndex !== -1) {
                  nextMatch.participants[emptySlotIndex] = { ...nextMatch.participants[emptySlotIndex], id: loserId, name: loserId || 'TBD', sourceMatchId: `${matchId}-loser` };
                }
              }
              newMatches[nextMatchIndex] = nextMatch;
            }
          }
        }

        return { ...t, matches: newMatches };
      });
      return updatedTournaments;
    });
  };

  const handleMatchClick = (match: any, participantId: string) => {
    if (!participantId || participantId === 'bye' || participantId === 'TBD') return;
    updateWinner(match.id, participantId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale.get() * delta, 0.1), 3);
      scale.set(newScale);
    }
  };

  const resetView = () => {
    zoomToFitAll();
    audioEngine.playTick(settings.soundTheme);
  };

  const renderRound = (roundMatches: any[]) => (
    <div key={roundMatches[0]?.tournamentRoundText} className="flex flex-col justify-around gap-16 py-4 relative min-w-[320px]">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
        <div className="px-6 py-2 bg-surface rounded-full border-2 border-slate-100 shadow-sm min-w-[120px]">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic block text-center">{roundMatches[0]?.tournamentRoundText}</span>
        </div>
      </div>
      
      {roundMatches.map((m) => (
        <div key={m.id} className="relative flex items-center">
          <div 
            ref={(el) => { matchRefs.current[m.id] = el; }}
            className="w-80 bg-surface rounded-[2.5rem] border-4 border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden group/match transition-all z-10"
          >
            {m.participants.map((p: any, pIdx: number) => {
              const isTBD = !p.id || p.id === 'TBD';
              const isBye = p.id === 'bye';
              const isSelectedWinner = p.isWinner;
              
              return (
                <button
                  key={pIdx}
                  onClick={(e) => { e.stopPropagation(); handleMatchClick(m, p.id); }}
                  disabled={isTBD || isBye}
                  className={`w-full px-10 py-7 flex items-center justify-between border-b-4 border-slate-50 last:border-b-0 transition-all relative overflow-hidden text-left ${
                    isSelectedWinner 
                      ? 'bg-[#35B995] text-white' 
                      : isTBD || isBye 
                        ? 'bg-slate-50/50 text-slate-300' 
                        : 'bg-surface text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-5 truncate relative z-10">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black transition-colors ${
                      isSelectedWinner ? 'bg-surface/20 text-white' : 'bg-slate-100 text-neutral-400'
                    }`}>{pIdx + 1}</div>
                    <div className="flex flex-col items-start truncate">
                      <span className={`text-xs font-black uppercase tracking-[0.15em] ${isSelectedWinner ? 'text-white/70' : 'text-neutral-400'}`}>Competitor</span>
                      <span className={`text-xl font-black uppercase truncate tracking-tight leading-none mt-1 ${isSelectedWinner ? 'text-white' : 'text-slate-700'}`}>{isBye ? 'BYE' : (p.name || 'TBD')}</span>
                    </div>
                  </div>
                  {isSelectedWinner && (
                    <div className="flex flex-col items-end relative z-10 shrink-0">
                       <Check size={24} strokeWidth={4} className="text-white mb-0.5" />
                       <span className="text-xs font-black uppercase tracking-widest text-white/90">Winner</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );



  return (
    <div className="flex-1 flex flex-col min-h-0 italic overflow-hidden">
      <div className="px-6 py-6 flex items-center justify-between border-b-4 border-slate-50 bg-surface shrink-0">
        <div className="flex-1 flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-neutral-400 hover:text-primary hover:bg-surface hover:shadow-md transition-all active:scale-90"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
              <Trophy size={24} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{tournament.name}</h3>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{tournament.type === 'single' ? 'Single' : 'Double'} Elimination</span>
            </div>
          </div>
        </div>
        
        <div className="flex-none flex items-center justify-center px-4">
          <div className="flex items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-[800px] no-scrollbar">
            {navigationButtons.map((btn, idx) => (
              <button
                key={`${btn.label}-${idx}`}
                onClick={btn.onClick}
                className={`px-4 py-3 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 uppercase tracking-widest shrink-0 ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <button 
            onClick={handleExport}
            className="px-8 py-4 bg-surface border-2 border-slate-100 rounded-xl text-neutral-400 hover:text-primary hover:border-primary/20 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            title="Export as PNG"
          >
            <Download size={18} strokeWidth={3} />
            Export Image
          </button>
          <button 
            onClick={resetView} 
            className="p-3 bg-surface border-2 border-slate-100 rounded-xl text-neutral-400 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
            title="Reset View"
          >
            <Maximize2 size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className="flex-1 relative overflow-hidden bg-slate-50/10 cursor-grab active:cursor-grabbing"
      >
        <motion.div 
          drag
          dragMomentum={true}
          dragElastic={0}
          style={{ x, y, scale, transformOrigin: '0 0' }}
          className="absolute top-0 left-0"
        >
          <div ref={roundsRef} className="relative rounds-container">
            {/* Connector SVG Layer - now inside the rounds container */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
              {matches.map((m: any) => {
                if (!m.nextMatchId) return null;
                const start = matchPositions[m.id];
                const nextMatch = matches.find((nm: any) => nm.id === m.nextMatchId);
                if (!nextMatch) return null;
                const end = matchPositions[nextMatch.id];
                if (!start || !end) return null;

                return (
                  <g key={`link-${m.id}`}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="black"
                      strokeWidth="6"
                      strokeLinecap="round"
                      style={{ opacity: 0.8 }}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="flex gap-60 min-w-max items-center justify-center relative z-10 p-80">
              {/* Split Layout logic */}
              {(() => {
                const totalRounds = rounds.length;
                if (totalRounds === 0) return null;
                
                if (tournament.type === 'double') {
                  const winners = rounds.filter((_, i) => Object.keys(roundMap)[i].startsWith('W'));
                  const losers = rounds.filter((_, i) => Object.keys(roundMap)[i].startsWith('L'));
                  const final = rounds.filter((_, i) => Object.keys(roundMap)[i] === 'Final');
                  
                  return (
                    <>
                      {winners.map((rm) => renderRound(rm))}
                      {final.map((rm) => renderRound(rm))}
                      {losers.reverse().map((rm) => renderRound(rm))}
                    </>
                  );
                }

                const finalRoundIdx = totalRounds - 1;
                
                // If it's a very small bracket, just do standard left-to-right
                if (totalRounds < 2) return rounds.map((roundMatches) => renderRound(roundMatches));

                // For a split layout:
                // Left Wing: Rounds 1 to (N-1), top half
                // Center: Final
                // Right Wing: Rounds 1 to (N-1), bottom half (reversed order)
                
                const leftWing = rounds.slice(0, finalRoundIdx).map(rm => rm.slice(0, Math.ceil(rm.length / 2)));
                const rightWing = rounds.slice(0, finalRoundIdx).map(rm => rm.slice(Math.ceil(rm.length / 2))).reverse();
                const center = rounds[finalRoundIdx];

                return (
                  <>
                    {leftWing.map((rm) => renderRound(rm))}
                    {renderRound(center)}
                    {rightWing.map((rm) => renderRound(rm))}
                  </>
                );
              })()}
            </div>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
};

export const Tournaments = () => {
  const { settings, updateClass } = useSettings();
  const { setHeaderActions, setHelpContent, clearHeader } = useHeader();
  const [tournaments, setTournaments] = useLocalStorage('tournaments_list', []);
  const [activeTournamentId, setActiveTournamentId] = useLocalStorage('tournaments_active_id', null);
  const [step, setStep] = useState('setup');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('blank');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const tournamentIdCounter = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { if (tournamentIdCounter.current === 0) tournamentIdCounter.current = Date.now(); }, []);

  const activeTournament = useMemo(() => tournaments.find((t: any) => t.id === activeTournamentId), [tournaments, activeTournamentId]);

  useEffect(() => {
    if (activeTournament) {
      setSelectedClassId(activeTournament.classId || 'blank');
      setStep(activeTournament.step || 'setup');
      setSelectedStudents(activeTournament.participants || []);
    } else {
      setStep('setup');
      setSelectedStudents([]);
    }
  }, [activeTournamentId, activeTournament]);

  const deleteTournament = useCallback(() => {
    if (activeTournamentId) {
      if (window.confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
        setTournaments((prev: any) => prev.filter((t: any) => t.id !== activeTournamentId));
        setActiveTournamentId(null);
        audioEngine.playTick(settings.soundTheme);
      }
    }
  }, [activeTournamentId, setTournaments, setActiveTournamentId, settings.soundTheme]);

  const addTournament = useCallback(() => {
    let nextNum = 1;
    while (tournaments.map((t: any) => t.name).includes(`Tournament ${nextNum}`)) nextNum++;
    const newTournament = { id: (tournamentIdCounter.current++).toString(), name: `Tournament ${nextNum}`, type: 'elo', step: 'setup', participants: [], classId: settings.classes[0]?.id || '' };
    setTournaments([...tournaments, newTournament]);
    setActiveTournamentId(newTournament.id);
    audioEngine.playTick(settings.soundTheme);
  }, [tournaments, settings.classes, settings.soundTheme, setTournaments, setActiveTournamentId]);

  useEffect(() => {
    if (activeTournamentId && activeTournament) {
      const currentParticipants = activeTournament.participants || [];
      const currentClassId = activeTournament.classId || 'blank';
      if (JSON.stringify(currentParticipants) !== JSON.stringify(selectedStudents) || currentClassId !== selectedClassId) {
        setTournaments((prev: any) => prev.map((t: any) => 
          t.id === activeTournamentId ? { ...t, participants: selectedStudents, classId: selectedClassId } : t
        ));
      }
    }
  }, [selectedStudents, selectedClassId, activeTournamentId, setTournaments, activeTournament]);

  /* const resetTournament = useCallback(() => {
    if (window.confirm('Reset all match results?')) {
      setTournaments((prev: any) => prev.map((t: any) => {
        if (t.id !== activeTournamentId) return t;
        return { ...t, eloRatings: {}, eloHistory: [] };
      }));
      audioEngine.playTick(settings.soundTheme);
    }
  }, [activeTournamentId, setTournaments, settings.soundTheme]); */

  useEffect(() => {
    setHelpContent(HELP_INFO);
    return () => clearHeader();
  }, [clearHeader, setHelpContent]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4 italic">
        <div className="flex bg-surface p-1.5 rounded-2xl border-2 border-slate-100 ">
           <select value={activeTournamentId || ''} onChange={(e) => e.target.value === 'new' ? addTournament() : setActiveTournamentId(e.target.value)} className="px-6 py-2 bg-transparent rounded-xl font-black text-[10px] text-slate-800 outline-none transition-all uppercase tracking-widest cursor-pointer">
            <option value="" disabled>Active Session</option>
            {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="new" className="text-primary font-black">+ Start New</option>
           </select>
        </div>
      </div>
    );
  }, [activeTournamentId, tournaments, addTournament, setActiveTournamentId, setHeaderActions]);

  const initiateTournament = () => {
    if (!selectedStudents.length) return;
    audioEngine.playTick(settings.soundTheme);
    
    const type = activeTournament?.type || 'elo';

    // For ELO: always preserve existing data, just go to active
    if (type === 'elo') {
      setTournaments((prev: any) => prev.map((t: any) => {
        if (t.id !== activeTournamentId) return t;
        return { 
          ...t, 
          step: 'active', 
          participants: selectedStudents,
          // Only initialise ratings/history if they don't exist yet
          eloRatings: t.eloRatings && Object.keys(t.eloRatings).length > 0 ? t.eloRatings : {},
          eloHistory: t.eloHistory && t.eloHistory.length > 0 ? t.eloHistory : [],
        };
      }));
      setStep('active');
      return;
    }

    // If matches already exist for bracket types, just resume
    if (activeTournament?.matches && activeTournament.matches.length > 0) {
      setTournaments((prev: any) => prev.map((t: any) => 
        t.id === activeTournamentId ? { ...t, step: 'active' } : t
      ));
      setStep('active');
      return;
    }

    let matches: any[] = [];
    if (type === 'single') {
      matches = generateSingleElimination(selectedStudents);
    } else if (type === 'double') {
      matches = generateDoubleElimination(selectedStudents);
    }

    setTournaments((prev: any) => prev.map((t: any) => {
      if (t.id !== activeTournamentId) return t;
      return { 
        ...t, 
        step: 'active', 
        participants: selectedStudents, 
        matches: matches
      };
    }));
    setStep('active');
  };

  const handleManageClasses = () => {
    window.history.pushState({}, '', '/config/classes');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="flex h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out" style={{ gap: step === 'setup' ? '2rem' : '0' }}>
      <ClassPanel
        isOpen={step === 'setup'}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        students={settings.classes.find(c => c.id === selectedClassId)?.students || (selectedClassId === 'blank' ? selectedStudents : [])}
        onStudentsChange={(students) => {
          setSelectedStudents(students);
          const cls = settings.classes.find(c => c.id === selectedClassId);
          if (cls) updateClass({ ...cls, students });
        }}
        onManageClasses={handleManageClasses}
        onClose={() => {}} // Satisfy required prop
      />

      <ToolPanel alignTop fluid baseWidth={isMobile ? 640 : 1200} baseHeight={800} padding={40}>
        <div className="w-full flex flex-col relative z-10 h-full overflow-hidden">
          {!activeTournament ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-12 relative overflow-hidden group">
              <div className="tool-grid-bg opacity-20 pointer-events-none" />
              <div className="relative w-48 h-48 rounded-[4rem] bg-primary flex items-center justify-center text-white border-[12px] border-white rotate-3 shadow-2xl">
                <Trophy size={96} strokeWidth={1} />
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Tournament Maker</h2>
                <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.5em] mt-4">Make a new game or leaderboard</p>
              </div>
              <button 
                onClick={addTournament} 
                className="h-20 px-16 bg-primary text-white rounded-[2.5rem] font-black text-xl lg:text-lg uppercase tracking-[0.2em] hover:bg-dark-bg transition-all active:scale-95 border-8 border-white shadow-xl"
              >
                Start
              </button>
            </div>
          ) : step === 'setup' ? (
            <div className="flex-1 flex flex-col gap-6 relative overflow-hidden group">
              {/* Tournament Config */}
              <div className="flex flex-col bg-surface/40 backdrop-blur-md rounded-[3rem] border-4 border-white shrink-0 relative z-10 overflow-hidden">
                {/* Tournament Config Section */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 p-6 lg:p-8">
                  {/* Left side: Icon and Name */}
                  <div className="flex-1 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
                      <Trophy size={32} strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">Tournament Name</span>
                      <div className="relative group/input">
                        <input 
                          type="text" 
                          value={activeTournament?.name || ''}
                          onChange={(e) => setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, name: e.target.value } : t))}
                          className="w-full text-3xl font-black text-slate-800 uppercase tracking-tight bg-surface/60 border-4 border-white focus:border-indigo-500 focus:bg-surface rounded-[1.5rem] px-5 py-3 outline-none transition-all placeholder:text-slate-200"
                          placeholder="Enter Tournament Name..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-16 bg-surface/50 mx-2" />

                  {/* Right side: Type selection */}
                  <div className="flex-1 flex flex-col lg:justify-center">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block lg:hidden">Tournament Type</span>
                    <div className="flex gap-2">
                      {[
                        { id: 'single', label: 'Single', Icon: Trophy },
                        { id: 'double', label: 'Double', Icon: RotateCcw },
                        { id: 'elo', label: 'Ranking', Icon: TrendingUp }
                      ].map((t) => {
                        const isStarted = activeTournament?.matches && activeTournament.matches.length > 0;
                        const isDisabled = isStarted;
                        
                        return (
                          <button
                            key={t.id}
                            disabled={isDisabled}
                            onClick={() => {
                              setTournaments((prev: any) => prev.map((curr: any) => curr.id === activeTournamentId ? { ...curr, type: t.id } : curr));
                              audioEngine.playTick(settings.soundTheme);
                            }}
                            className={`flex-1 flex items-center justify-center gap-3 px-4 py-6 lg:py-4 rounded-[1.5rem] font-black text-xl lg:text-xs uppercase tracking-widest transition-all ${
                              (activeTournament?.type || 'elo') === t.id
                                ? 'bg-primary text-white shadow-lg scale-105'
                                : isDisabled
                                  ? 'bg-slate-50 border-4 border-slate-50 text-slate-200 cursor-not-allowed opacity-50'
                                  : 'bg-surface border-4 border-white text-neutral-400 hover:border-primary/20 hover:text-primary'
                            }`}
                          >
                            <t.Icon size={isMobile ? 24 : 16} /> {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-surface/50" />

                {/* Players Header Section */}
                <div className="flex items-center justify-between px-8 py-6 bg-surface/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center text-primary border-2 border-slate-50">
                      <Users size={24} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Players</h3>
                      <span className="text-xs font-black text-neutral-400 uppercase tracking-widest mt-1">Select participants</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => { setSelectedStudents(settings.classes.find(c => c.id === selectedClassId)?.students || []); audioEngine.playTick(settings.soundTheme); }} 
                      className="px-8 py-4 bg-surface border-2 border-slate-100 rounded-xl text-xs font-black text-neutral-400 uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all"
                    >
                      All
                    </button>
                    <div className="h-14 px-8 bg-surface/60 rounded-full flex items-center justify-center text-xs font-black text-neutral-400 uppercase tracking-[0.2em] border-2 border-white">
                      <span className="text-primary mr-2">{selectedStudents.length}</span> Selected
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Area */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 no-scrollbar relative z-10 pb-4">
                {(settings.classes.find(c => c.id === selectedClassId)?.students || []).map((s, i) => {
                  const isSelected = selectedStudents.includes(s);
                  return (
                    <button 
                      key={i} 
                      onClick={() => { if (isSelected) setSelectedStudents(prev => prev.filter(name => name !== s)); else setSelectedStudents(prev => [...prev, s]); audioEngine.playTick(settings.soundTheme); }} 
                      className={`p-3 min-h-[4rem] rounded-2xl border-4 transition-none group/item flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-primary border-indigo-600 text-white shadow-lg' 
                          : 'bg-surface border-white text-slate-600 hover:border-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-black ${
                        isSelected ? 'bg-surface/20 text-white' : 'bg-slate-50 text-slate-300'
                      }`}>{i + 1}</div>
                      <span className="text-sm lg:text-base font-black uppercase tracking-tight whitespace-normal break-words leading-tight flex-1 text-left line-clamp-2">{s}</span>
                      {isSelected && <Check size={18} strokeWidth={4} />}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Action */}
              <div className="shrink-0 flex justify-center items-center gap-4 pb-2">
                <button 
                  onClick={deleteTournament}
                  className="h-14 px-8 bg-surface border-4 border-white text-neutral-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-caution transition-all active:scale-95 shadow-lg flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete
                </button>
                <button 
                  onClick={initiateTournament} 
                  disabled={selectedStudents.length < 2} 
                  className="h-14 px-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-dark-bg transition-all active:scale-95 border-4 border-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Play size={18} fill="currentColor" className="inline mr-3" /> 
                  {(activeTournament?.type === 'elo' && activeTournament?.eloHistory?.length > 0) || (activeTournament?.matches?.length > 0) ? 'Resume' : 'Start'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 italic overflow-hidden">
              {activeTournament.type === 'elo' ? (
                <EloManager 
                  participants={activeTournament.participants} 
                  eloRatings={activeTournament.eloRatings || {}} 
                  setEloRatings={(r: any) => setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, eloRatings: typeof r === 'function' ? r(t.eloRatings || {}) : r } : t))} 
                  eloHistory={activeTournament.eloHistory || []} 
                  setEloHistory={(h: any) => setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, eloHistory: typeof h === 'function' ? h(t.eloHistory || []) : h } : t))} 
                  onBack={() => {
                    setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, step: 'setup' } : t));
                    setStep('setup');
                  }}
                  isMobile={isMobile}
                />
              ) : (
                <BracketManager 
                  tournament={activeTournament} 
                  setTournaments={setTournaments} 
                  activeTournamentId={activeTournamentId} 
                  onBack={() => {
                    setTournaments((prev: any) => prev.map((t: any) => t.id === activeTournamentId ? { ...t, step: 'setup' } : t));
                    setStep('setup');
                  }}
                />
              )}
            </div>
          )}
        </div>
      </ToolPanel>
    </div>
  );
};

export default Tournaments;
