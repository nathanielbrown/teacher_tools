import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Play, RotateCcw,
  Trash2, Plus, Shuffle, List as ListIcon, Settings, X,
  Shield, TrendingUp, Check, MousePointer2, ChevronUp,
  ChevronDown, Maximize2, UserPlus, Info, Star, History,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSettings } from '../../contexts/SettingsContext';
import { audioEngine } from '../../utils/audio';
import { ToolHeader } from '../ToolHeader';

const K_FACTOR = 32;
const BASE_RATING = 1200;

const EloManager = ({ participants, eloRatings, setEloRatings, eloHistory, setEloHistory }) => {
  const [selectedWinner, setSelectedWinner] = useState('');
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const recalculateAll = (history) => {
    const newRatings = {};
    participants.forEach(p => newRatings[p] = 1200);

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

  const recordMatch = (winner, loser) => {
    if (!winner || !loser || winner === loser) return;

    const rW = eloRatings[winner] || BASE_RATING;
    const rL = eloRatings[loser] || BASE_RATING;

    const eW = 1 / (1 + Math.pow(10, (rL - rW) / 400));
    const eL = 1 / (1 + Math.pow(10, (rW - rL) / 400));

    const nW = Math.round(rW + K_FACTOR * (1 - eW));
    const nL = Math.round(rL + K_FACTOR * (0 - eL));

    setEloRatings(prev => ({ ...prev, [winner]: nW, [loser]: nL }));

    const match = {
      id: Date.now(),
      winner,
      loser,
      winnerOld: rW,
      winnerNew: nW,
      loserOld: rL,
      loserNew: nL,
      date: new Date().toISOString()
    };
    setEloHistory([match, ...eloHistory]);
  };

  const handleStudentClick = (student) => {
    if (editingMatchId) {
      const match = eloHistory.find(m => m.id === editingMatchId);
      if (!match) return;

      let newHistory;
      if (match.winner === student) {
        newHistory = eloHistory.map(m => m.id === editingMatchId ? { ...m, winner: null } : m);
      } else if (match.loser === student) {
        newHistory = eloHistory.map(m => m.id === editingMatchId ? { ...m, loser: null } : m);
      } else if (!match.winner) {
        newHistory = eloHistory.map(m => m.id === editingMatchId ? { ...m, winner: student } : m);
      } else if (!match.loser) {
        newHistory = eloHistory.map(m => m.id === editingMatchId ? { ...m, loser: student } : m);
      } else {
        return;
      }

      recalculateAll(newHistory);
      const updatedMatch = newHistory.find(m => m.id === editingMatchId);
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

  const deleteMatch = (id) => {
    const newHistory = eloHistory.filter(m => m.id !== id);
    recalculateAll(newHistory);
    setEditingMatchId(null);
  };

  const editingMatch = useMemo(() => 
    eloHistory.find(m => m.id === editingMatchId),
    [eloHistory, editingMatchId]
  );

  const sortedParticipants = [...participants].sort((a, b) => (eloRatings[b] || 1200) - (eloRatings[a] || 1200));

  const totalPages = Math.ceil(eloHistory.length / itemsPerPage);
  const currentHistory = eloHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full space-y-8">
      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-3 bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-50 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-xl tracking-tight">
              <ListIcon size={24} className="text-primary" />
              Rankings
            </h3>
            <div className="flex flex-col items-end gap-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {editingMatchId ? 'Select student to fill empty slot' : 'Click winner then loser to record match'}
              </p>
              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                <span>Base: {BASE_RATING}</span>
                <span>•</span>
                <span>K: {K_FACTOR}</span>
                <span>•</span>
                <button 
                  onClick={() => alert(`Elo Rating System\n\nBase Rating: ${BASE_RATING}\nK-Factor: ${K_FACTOR}\n\nThe Elo system calculates skill levels based on match results. When a student wins, their rating increases, and the loser's rating decreases. The amount of change depends on the difference between their current ratings—beating a higher-ranked opponent results in a larger gain than beating a lower-ranked one.`)}
                  className="flex items-center gap-0.5 hover:text-primary transition-colors cursor-help"
                  title="Click to learn about the Elo formula"
                >
                  <Info size={10} />
                  Elo Formula
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedParticipants.map((p, i) => {
              const isWinner = editingMatch?.winner === p;
              const isLoser = editingMatch?.loser === p;
              const isSelected = selectedWinner === p || isWinner || isLoser;
              const isEditingMode = !!editingMatchId;

              return (
                <button 
                  key={p} 
                  onClick={() => handleStudentClick(p)}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-between group transition-all ${
                    isWinner ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200' :
                    isLoser ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-200' :
                    selectedWinner === p ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200' :
                    'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-xl text-[10px] font-black border transition-all ${
                      isSelected ? (isLoser ? 'bg-rose-500 text-white border-rose-400' : 'bg-emerald-500 text-white border-emerald-400') : 'bg-white text-slate-300 border-slate-100'
                    }`}>{i + 1}</span>
                    <span className={`font-bold text-xs truncate ${
                      isWinner ? 'text-emerald-700' : 
                      isLoser ? 'text-rose-700' : 
                      selectedWinner === p ? 'text-emerald-700' : 
                      'text-slate-700'
                    }`}>{p}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-black ${
                      isWinner ? 'text-emerald-600' : 
                      isLoser ? 'text-rose-600' : 
                      selectedWinner === p ? 'text-emerald-600' : 
                      'text-primary'
                    }`}>{eloRatings[p] || 1200}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-slate-50 flex flex-col min-h-[500px]">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg tracking-tight mb-6">
            <History size={20} className="text-primary" />
            Match History
          </h3>

          <div className="flex-1 space-y-1 overflow-visible">
            {currentHistory.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Info size={32} className="text-slate-200 mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matches</p>
              </div>
            ) : (
              currentHistory.map(m => {
                const isEditing = editingMatchId === m.id;
                return (
                  <div 
                    key={m.id} 
                    onClick={() => {
                      if (!isEditing) {
                        setEditingMatchId(m.id);
                        setSelectedWinner('');
                      }
                    }}
                    className={`p-2 rounded-xl border-2 transition-all relative group cursor-pointer ${isEditing ? 'border-primary bg-primary/5 shadow-md scale-[1.02] z-10' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div
                        className={`flex-1 text-[9px] font-black truncate px-1 py-0.5 rounded-md transition-all text-center ${
                          isEditing ? (m.winner ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400 animate-pulse') : 'text-emerald-600'
                        }`}
                      >
                        {m.winner || 'Winner?'}
                      </div>
                      <span className="text-[7px] font-black text-slate-300 shrink-0">vs</span>
                      <div
                        className={`flex-1 text-[9px] font-black truncate px-1 py-0.5 rounded-md transition-all text-center ${
                          isEditing ? (m.loser ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400 animate-pulse') : 'text-rose-500'
                        }`}
                      >
                        {m.loser || 'Loser?'}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[7px] font-black text-slate-400 uppercase tracking-tighter border-t border-slate-100/50 pt-0.5">
                      <span>{m.winnerNew - m.winnerOld > 0 ? `+${m.winnerNew - m.winnerOld}` : m.winnerNew - m.winnerOld} pts</span>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); deleteMatch(m.id); }} className="text-rose-500 hover:scale-110"><Trash2 size={10} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingMatchId(null); }} className="text-slate-400 hover:scale-110"><X size={10} /></button>
                        </div>
                      ) : (
                        <span>{m.loserNew - m.loserOld} pts</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Tournaments = () => {
  const { settings } = useSettings();
  const [tournaments, setTournaments] = useLocalStorage('tournaments_list', []);
  const [activeTournamentId, setActiveTournamentId] = useLocalStorage('active_tournament_id', null);

  const [step, setStep] = useState('setup');
  const [tournamentType, setTournamentType] = useState('single');
  const [participants, setParticipants] = useState([]);
  const [bracketSize, setBracketSize] = useState(16);
  const [selectedClassId, setSelectedClassId] = useState(settings.classes[0]?.id || '');
  const [zoom, setZoom] = useState(0.8);
  const [minZoom, setMinZoom] = useState(0.2);
  const containerRef = React.useRef(null);
  const bracketRef = React.useRef(null);

  const activeTournament = useMemo(() =>
    tournaments.find(t => t.id === activeTournamentId),
    [tournaments, activeTournamentId]
  );

  const tournamentData = activeTournament?.data;

  // Sync state when active tournament changes
  useEffect(() => {
    if (activeTournament) {
      setTournamentType(activeTournament.type);
      setParticipants(activeTournament.participants || []);
      setBracketSize(activeTournament.bracketSize || 16);
      setSelectedClassId(activeTournament.classId || '');
      setStep(activeTournament.step || 'setup');
    } else {
      setStep('setup');
    }
  }, [activeTournamentId]);

  useEffect(() => {
    if (step === 'active' && bracketRef.current && containerRef.current && tournamentType !== 'elo') {
      const updateZoom = () => {
        const containerWidth = containerRef.current.clientWidth - 64;
        const containerHeight = containerRef.current.clientHeight - 64;
        const bracketWidth = bracketRef.current.scrollWidth;
        const bracketHeight = bracketRef.current.scrollHeight;

        if (bracketWidth > 0 && bracketHeight > 0) {
          const fitZoom = Math.min(1.5, containerWidth / bracketWidth, containerHeight / bracketHeight);
          setMinZoom(fitZoom);
          setZoom(fitZoom);
        }
      };

      const timer = setTimeout(updateZoom, 200);
      window.addEventListener('resize', updateZoom);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateZoom);
      };
    }
  }, [step, activeTournamentId, tournamentData?.numRounds, tournamentType]);

  useEffect(() => {
    if (activeTournament) {
      setTournamentType(activeTournament.type || 'single');
      setBracketSize(activeTournament.bracketSize || 16);
      setSelectedClassId(activeTournament.classId || settings.classes[0]?.id || '');
      setParticipants(activeTournament.participants || []);
      setStep(activeTournament.step || 'setup');
    }
  }, [activeTournamentId]);

  const handleSettingChange = (setting, value) => {
    if (activeTournament?.data) {
      if (!window.confirm('Changing this setting may clear your current tournament progress. Continue?')) {
        return;
      }
    }

    if (setting === 'type') setTournamentType(value);
    if (setting === 'size') setBracketSize(value);
    if (setting === 'class') {
      setSelectedClassId(value);
      setParticipants([]);
    }

    if (activeTournament?.data) {
      setTournaments(prev => prev.map(t =>
        t.id === activeTournamentId ? { ...t, data: null } : t
      ));
    }
  };

  const addTournament = () => {
    let nextNum = 1;
    const names = tournaments.map(t => t.name);
    while (names.includes(`Tournament ${nextNum}`)) {
      nextNum++;
    }
    const name = `Tournament ${nextNum}`;

    const newTournament = {
      id: Date.now().toString(),
      name,
      type: 'single',
      step: 'setup',
      participants: [],
      bracketSize: 16,
      data: null,
      classId: settings.classes[0]?.id || ''
    };
    setTournaments([...tournaments, newTournament]);
    setActiveTournamentId(newTournament.id);
  };

  const deleteTournament = (id) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      const newTournaments = tournaments.filter(t => t.id !== id);
      setTournaments(newTournaments);
      if (activeTournamentId === id) {
        setActiveTournamentId(null);
      }
    }
  };

  const generateSingleElimination = (players) => {
    const n = players.length;
    const numRounds = Math.ceil(Math.log2(n));
    const bracketSize = Math.pow(2, numRounds);

    let matches = [];
    for (let r = 0; r < numRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r + 1);
      for (let i = 0; i < matchesInRound; i++) {
        let side = 'center';
        if (r < numRounds - 1) {
          side = i < matchesInRound / 2 ? 'left' : 'right';
        }

        matches.push({
          id: `m-${r}-${i}`,
          round: r,
          participants: [null, null],
          seeds: [null, null],
          winner: null,
          nextMatchId: r === numRounds - 1 ? null : `m-${r + 1}-${Math.floor(i / 2)}`,
          position: i,
          side: side
        });
      }
    }

    const getSeededSlots = (size) => {
      let slots = [0, 1];
      for (let i = 2; i < size; i *= 2) {
        let nextSlots = [];
        for (let j = 0; j < slots.length; j++) {
          nextSlots.push(slots[j]);
          nextSlots.push(i * 2 - 1 - slots[j]);
        }
        slots = nextSlots;
      }
      return slots;
    };

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
          const slotIndex = match.position % 2;
          if (nextMatch.participants[slotIndex] !== match.winner) {
            nextMatch.participants[slotIndex] = match.winner;
            changed = true;
          }
        }
      });
    }

    return { type: 'single', participants: players, matches, numRounds, bracketSize };
  };

  const generateDoubleElimination = (players) => {
    const single = generateSingleElimination(players);
    const winnersMatches = single.matches.map(m => ({ ...m, id: `w-${m.id}`, nextMatchId: m.nextMatchId ? `w-${m.nextMatchId}` : 'grand-final' }));
    let losersMatches = [];
    const numRounds = single.numRounds;

    for (let r = 0; r < (numRounds - 1) * 2; r++) {
      const matchesInRound = Math.pow(2, Math.floor((numRounds - 2 - Math.floor(r / 2))));
      if (matchesInRound < 1) continue;
      for (let i = 0; i < matchesInRound; i++) {
        losersMatches.push({ id: `l-${r}-${i}`, round: r, participants: [null, null], winner: null, nextMatchId: `l-${r + 1}-${Math.floor(i / 2)}`, position: i, type: 'loser' });
      }
    }
    if (losersMatches.length > 0) losersMatches[losersMatches.length - 1].nextMatchId = 'grand-final';
    return { type: 'double', participants: players, matches: [...winnersMatches, ...losersMatches], numRounds: single.numRounds, bracketSize: single.bracketSize };
  };

  const generateTournament = (players, type) => {
    if (type === 'single') return generateSingleElimination(players);
    return generateDoubleElimination(players);
  };

  const handleSelectWinner = (matchId, winnerName) => {
    if (!winnerName) return;
    audioEngine.playTick(settings.soundTheme);
    setTournaments(prev => prev.map(t => {
      if (t.id !== activeTournamentId || t.type === 'elo') return t;
      const newMatches = JSON.parse(JSON.stringify(t.data.matches));
      const match = newMatches.find(m => m.id === matchId);
      if (!match) return t;
      match.winner = winnerName;
      if (t.type === 'double' && match.id.startsWith('w-')) {
        const loserName = match.participants.find(p => p !== winnerName && p !== null);
        if (loserName) {
          const losersRound = match.round;
          const potentialLMatches = newMatches.filter(m => m.id.startsWith('l-') && m.round === losersRound);
          for (let lm of potentialLMatches) {
            if (lm.participants[0] === null) { lm.participants[0] = loserName; break; }
            else if (lm.participants[1] === null) { lm.participants[1] = loserName; break; }
          }
        }
      }
      if (match.nextMatchId === 'grand-final') {
        const gf = newMatches.find(m => m.id === 'grand-final');
        if (!gf) newMatches.push({ id: 'grand-final', participants: [winnerName, null], winner: null });
        else gf.participants[matchId.startsWith('w-') ? 0 : 1] = winnerName;
      } else if (match.nextMatchId) {
        const nextMatch = newMatches.find(m => m.id === match.nextMatchId);
        if (nextMatch) nextMatch.participants[match.position % 2] = winnerName;
      }
      return { ...t, data: { ...t.data, matches: newMatches } };
    }));
  };

  const resetTournament = () => {
    if (window.confirm('Are you sure you want to reset the tournament progress? All match results will be cleared.')) {
      setTournaments(prev => prev.map(t => {
        if (t.id !== activeTournamentId) return t;
        
        if (t.type === 'elo') {
          return {
            ...t,
            eloRatings: {},
            eloHistory: []
          };
        }
        
        const newMatches = t.data.matches.map(match => {
          const m = { ...match, winner: null };
          if (m.round > 0 || m.id === 'grand-final') {
            m.participants = [null, null];
          }
          return m;
        });
        return { ...t, data: { ...t.data, matches: newMatches } };
      }));
    }
  };

  if (step === 'active' && activeTournament) {
    return (
      <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
        <ToolHeader
          title={activeTournament.name}
          icon={Trophy}
          description={`${activeTournament.type === 'double' ? 'Double Elimination' : activeTournament.type === 'single' ? 'Single Elimination' : 'Elo'} Tournament`}
        >
          <div className="flex items-center gap-3">
            {tournamentType !== 'elo' && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-slate-100 shadow-sm">
                <Maximize2 size={16} className="text-slate-400" />
                <input
                  type="range"
                  min={minZoom}
                  max="1.5"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-[10px] font-black text-slate-600 w-8">{Math.round(zoom * 100)}%</span>
              </div>
            )}

            <select
              value={activeTournamentId || ''}
              onChange={(e) => setActiveTournamentId(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-all text-sm shadow-sm"
            >
              <option value="" disabled>Switch Tournament...</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setStep('setup');
                setTournaments(prev => prev.map(t => t.id === activeTournamentId ? { ...t, step: 'setup' } : t));
              }}
              className="p-3 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all active:scale-95 border-2 border-transparent hover:border-primary/10 shadow-sm"
              title="Tournament Config"
            >
              <Settings size={24} />
            </button>
            <button
              onClick={resetTournament}
              className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 border-2 border-transparent hover:border-rose-100 shadow-sm"
              title="Reset Tournament"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        </ToolHeader>

        <div 
          ref={containerRef}
          className="flex-1 overflow-auto custom-scrollbar bg-slate-50/50 rounded-[3rem] border-2 border-slate-100/50 flex flex-col"
        >
          {tournamentType === 'elo' && activeTournament ? (
            <EloManager
              participants={activeTournament.participants}
              eloRatings={activeTournament.eloRatings || {}}
              setEloRatings={(ratings) => {
                setTournaments(prev => prev.map(t => {
                  if (t.id !== activeTournamentId) return t;
                  const currentRatings = t.eloRatings || {};
                  const nextRatings = typeof ratings === 'function' ? ratings(currentRatings) : ratings;
                  return { ...t, eloRatings: nextRatings };
                }));
              }}
              eloHistory={activeTournament.eloHistory || []}
              setEloHistory={(history) => {
                setTournaments(prev => prev.map(t => {
                  if (t.id !== activeTournamentId) return t;
                  const currentHistory = t.eloHistory || [];
                  const nextHistory = typeof history === 'function' ? history(currentHistory) : history;
                  return { ...t, eloHistory: nextHistory };
                }));
              }}
            />
          ) : (
            <div className="p-20 min-w-full min-h-full">
              <motion.div 
                ref={bracketRef}
                style={{ 
                  scale: zoom, 
                  transformOrigin: 'top left'
                }}
                className="transition-all duration-300 ease-out space-y-12 inline-flex flex-col"
              >


              <div className="space-y-12 w-full">
                {!tournamentData ? (
                  <div className="py-20 text-center space-y-4">
                    <Info size={48} className="text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-bold">This tournament hasn't been saved yet.</p>
                    <button
                      onClick={() => setStep('setup')}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-bold"
                    >
                      Go to Setup
                    </button>
                  </div>
                ) : tournamentData.type === 'single' ? (
                  <div className="flex gap-0 min-w-max items-center justify-center py-4">
                    {Array.from({ length: Math.max(0, (tournamentData?.numRounds || 1) - 1) }).map((_, roundIndex) => (
                      <div key={`left-${roundIndex}`} className="flex flex-col h-full min-h-[600px] justify-center">
                        <div className="text-center py-2"><h3 className="font-black text-slate-400 uppercase tracking-widest text-[8px]">R{roundIndex + 1}</h3></div>
                        <div className="flex-1 flex flex-col justify-around">
                          {tournamentData?.matches?.filter(m => m.round === roundIndex && m.side === 'left').map(match => (
                            <div key={match.id} className="flex-1 flex flex-col justify-center px-10 relative">
                              <MatchNode
                                match={match}
                                onSelectWinner={handleSelectWinner}
                                round={roundIndex}
                                hideNextLine={roundIndex >= (tournamentData?.numRounds || 1) - 2}
                              />
                              {match.nextMatchId && roundIndex < (tournamentData?.numRounds || 1) - 2 && (
                                <div className={`absolute w-px bg-slate-300 right-0 transition-colors ${match.position % 2 === 0 ? 'top-1/2 h-1/2' : 'top-0 h-1/2'}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col items-center justify-center h-full px-10 relative min-h-[600px]">
                      {(tournamentData?.type === 'single'
                        ? tournamentData?.matches?.find(m => m.side === 'center')?.winner
                        : tournamentData?.matches?.find(m => m.id === 'grand-final')?.winner) ? (
                        <div className="mb-6 text-amber-400 drop-shadow-xl animate-bounce">
                          <Trophy size={64} fill="currentColor" />
                        </div>
                      ) : null}
                      <ChampionNode
                        winner={
                          tournamentData?.type === 'single'
                            ? tournamentData?.matches?.find(m => m.side === 'center')?.winner
                            : tournamentData?.matches?.find(m => m.id === 'grand-final')?.winner
                        }
                      />
                      <div className="text-center mb-8"><h3 className="font-black text-primary uppercase tracking-widest text-[10px]">Grand Final</h3></div>
                      {tournamentData?.matches?.filter(m => m.side === 'center').map(match => (
                        <MatchNode key={match.id} match={match} onSelectWinner={handleSelectWinner} isCenter round={(tournamentData?.numRounds || 1) - 1} />
                      ))}
                    </div>
                    {Array.from({ length: Math.max(0, (tournamentData?.numRounds || 1) - 1) }).reverse().map((_, revIdx, arr) => {
                      const roundIndex = arr.length - 1 - revIdx;
                      return (
                        <div key={`right-${roundIndex}`} className="flex flex-col h-full min-h-[600px] justify-center">
                          <div className="text-center py-2"><h3 className="font-black text-slate-400 uppercase tracking-widest text-[8px]">R{roundIndex + 1}</h3></div>
                          <div className="flex-1 flex flex-col justify-around">
                            {tournamentData?.matches?.filter(m => m.round === roundIndex && m.side === 'right').map(match => (
                              <div key={match.id} className="flex-1 flex flex-col justify-center px-10 relative">
                                <MatchNode
                                  match={match}
                                  onSelectWinner={handleSelectWinner}
                                  mirrored
                                  round={roundIndex}
                                  hideNextLine={roundIndex >= (tournamentData?.numRounds || 1) - 2}
                                />
                                {match.nextMatchId && roundIndex < (tournamentData?.numRounds || 1) - 2 && (
                                  <div className={`absolute w-px bg-slate-300 left-0 transition-colors ${match.position % 2 === 0 ? 'top-1/2 h-1/2' : 'top-0 h-1/2'}`} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex gap-0 min-w-max items-center justify-center py-4">
                    {Array.from({ length: tournamentData?.numRounds || 0 }).map((_, roundIndex) => (
                      <div key={`winners-${roundIndex}`} className="flex flex-col h-full min-h-[600px] justify-center">
                        <div className="text-center py-2"><h3 className="font-black text-emerald-500 uppercase tracking-widest text-[8px]">W-R{roundIndex + 1}</h3></div>
                        <div className="flex-1 flex flex-col justify-around">
                          {tournamentData?.matches?.filter(m => m.id.startsWith('w-') && m.round === roundIndex).map(match => (
                            <div key={match.id} className="flex-1 flex flex-col justify-center px-10 relative">
                              <MatchNode match={match} onSelectWinner={handleSelectWinner} round={roundIndex} />
                              {match.nextMatchId && match.nextMatchId !== 'grand-final' && <div className={`absolute w-px bg-slate-300 right-0 transition-colors ${match.position % 2 === 0 ? 'top-1/2 h-1/2' : 'top-0 h-1/2'}`} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col items-center justify-center h-full px-10 relative min-h-[600px]">
                      {tournamentData?.matches?.find(m => m.id === 'grand-final')?.winner ? (
                        <div className="mb-6 text-amber-400 drop-shadow-xl animate-bounce">
                          <Trophy size={64} fill="currentColor" />
                        </div>
                      ) : null}
                      <div className="text-center mb-8"><h3 className="font-black text-primary uppercase tracking-widest text-[10px]">Grand Final</h3></div>
                      <MatchNode
                        match={{
                          id: 'grand-final',
                          participants: [
                            tournamentData?.matches?.find(m => m.id.startsWith('w-') && m.round === (tournamentData?.numRounds - 1))?.winner,
                            tournamentData?.matches?.find(m => m.nextMatchId === 'grand-final' && m.id.startsWith('l-'))?.winner
                          ],
                          winner: tournamentData?.matches?.find(m => m.id === 'grand-final')?.winner
                        }}
                        onSelectWinner={handleSelectWinner}
                        round={tournamentData?.numRounds || 0}
                        isCenter
                      />
                    </div>
                    {Array.from({ length: Math.max(0, Math.max(...(tournamentData?.matches.filter(m => m.id.startsWith('l-')).map(m => m.round) || [-1])) + 1) }).reverse().map((_, revIdx, arr) => {
                      const roundIndex = arr.length - 1 - revIdx;
                      return (
                        <div key={`losers-${roundIndex}`} className="flex flex-col h-full min-h-[600px] justify-center">
                          <div className="text-center py-2"><h3 className="font-black text-rose-500 uppercase tracking-widest text-[8px]">L-R{roundIndex + 1}</h3></div>
                          <div className="flex-1 flex flex-col justify-around">
                            {tournamentData?.matches?.filter(m => m.id.startsWith('l-') && m.round === roundIndex).map(match => (
                              <div key={match.id} className="flex-1 flex flex-col justify-center px-10 relative">
                                <MatchNode match={match} onSelectWinner={handleSelectWinner} mirrored round={roundIndex} />
                                {match.nextMatchId && match.nextMatchId !== 'grand-final' && <div className={`absolute w-px bg-slate-300 left-0 transition-colors ${match.position % 2 === 0 ? 'top-1/2 h-1/2' : 'top-0 h-1/2'}`} />}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 pt-2 pb-8 h-full flex flex-col gap-8">
      <ToolHeader
        title="Tournaments"
        icon={Trophy}
        description="Organize tournament brackets for your class."
      >
        <div className="flex items-center gap-3">
          <select
            value={activeTournamentId || ''}
            onChange={(e) => {
              if (e.target.value === 'new') {
                addTournament();
              } else {
                setActiveTournamentId(e.target.value);
              }
            }}
            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-all text-sm shadow-sm"
          >
            <option value="" disabled>Select Tournament...</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value="new" className="text-primary font-bold">+ Add New Tournament</option>
          </select>
        </div>
      </ToolHeader>

      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-slate-50 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-primary" />
                Tournament Config
              </h3>
              {activeTournamentId && (
                <button
                  onClick={() => deleteTournament(activeTournamentId)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Delete current tournament"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {activeTournament && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tournament Name</label>
                  <input
                    type="text"
                    value={activeTournament.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setTournaments(prev => prev.map(t => t.id === activeTournamentId ? { ...t, name: newName } : t));
                    }}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-all"
                    placeholder="Enter tournament name..."
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tournament Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'single', label: 'Single', icon: Trophy },
                    { id: 'double', label: 'Double', icon: Shield },
                    { id: 'elo', label: 'Elo', icon: TrendingUp },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleSettingChange('type', type.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${tournamentType === type.id ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      <type.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {tournamentType !== 'elo' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bracket Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[4, 8, 16].map(size => (
                      <button
                        key={size}
                        onClick={() => handleSettingChange('size', size)}
                        className={`p-3 rounded-2xl border-2 transition-all font-black text-sm ${bracketSize === size ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Select Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleSettingChange('class', e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-all"
                >
                  <option value="">Choose a class...</option>
                  {settings.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        <div className="md:col-span-3 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col gap-1">
                <h3 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                  <Users size={24} className="text-primary" />
                  Select Students
                </h3>
                <p className="text-slate-400 text-sm font-medium">Choose {tournamentType === 'elo' ? 'any number of' : bracketSize} students.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const students = settings.classes.find(c => c.id === selectedClassId)?.students || [];
                    const count = tournamentType === 'elo' ? students.length : bracketSize;
                    const shuffled = [...students].sort(() => Math.random() - 0.5).slice(0, count);
                    setParticipants(shuffled);
                  }}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 text-xs font-black border-2 border-slate-100"
                >
                  <Shuffle size={14} /> Random
                </button>
                <button
                  onClick={() => {
                    const students = settings.classes.find(c => c.id === selectedClassId)?.students || [];
                    const count = tournamentType === 'elo' ? students.length : bracketSize;
                    setParticipants(students.slice(0, count));
                  }}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 text-xs font-black border-2 border-slate-100"
                >
                  <Users size={14} /> All
                </button>
                <div className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                  tournamentType !== 'elo' && participants.length > bracketSize 
                    ? 'bg-rose-50 text-rose-600' 
                    : participants.length === bracketSize || (tournamentType === 'elo' && participants.length > 0) 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-primary/10 text-primary'
                }`}>
                  {participants.length}{tournamentType !== 'elo' && ` / ${bracketSize}`} Selected
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-8">
              {settings.classes.find(c => c.id === selectedClassId)?.students.map(student => {
                const index = participants.indexOf(student);
                const isSelected = index !== -1;
                return (
                  <button
                    key={student}
                    onClick={() => {
                      if (isSelected) {
                        setParticipants(prev => prev.filter(p => p !== student));
                      } else if (tournamentType === 'elo' || participants.length < bracketSize) {
                        setParticipants(prev => [...prev, student]);
                      }
                    }}
                    className={`p-2 rounded-xl border-2 transition-all text-left flex items-center gap-2 relative overflow-hidden group ${isSelected ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'}`}
                  >
                    {isSelected ? (
                      <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-md text-[10px] font-black">
                        {index + 1}
                      </div>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary/30 transition-all" />
                    )}
                    <span className="font-bold text-[11px] truncate leading-tight">{student}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-6">
              <button
                disabled={!activeTournamentId || (tournamentType !== 'elo' && participants.length === 0) || (tournamentType === 'elo' && participants.length < 2)}
                onClick={() => {
                  if (tournamentType !== 'elo' && participants.length > bracketSize) {
                    alert(`Too many students selected! You have ${participants.length} but the bracket only supports ${bracketSize}. Please deselect ${participants.length - bracketSize} student(s) or increase the bracket size.`);
                    return;
                  }

                  let seededParticipants = [...participants].sort(() => Math.random() - 0.5);

                  const data = tournamentType === 'elo' ? null : generateTournament(seededParticipants, tournamentType);
                  setTournaments(prev => prev.map(t =>
                    t.id === activeTournamentId ? {
                      ...t,
                      data,
                      step: 'active',
                      participants: seededParticipants,
                      bracketSize: bracketSize,
                      type: tournamentType,
                      classId: selectedClassId,
                      seedingMethod: seedingMethod
                    } : t
                  ));
                  setStep('active');
                }}
                className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale ${
                  tournamentType !== 'elo' && participants.length > bracketSize
                    ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600'
                    : 'bg-primary text-white shadow-primary/30 hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                Save and Preview
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchNode = ({ match, onSelectWinner, mirrored, isCenter, round, hideNextLine }) => (
  <div className="relative group/match">
    {round > 0 && !isCenter && (
      <div className={`absolute top-1/2 w-10 h-px bg-slate-300 -translate-y-1/2 transition-colors ${mirrored ? '-right-10' : '-left-10'}`} />
    )}

    {isCenter && (
      <>
        <div className="absolute top-1/2 w-10 h-px bg-slate-300 -translate-y-1/2 -left-10" />
        <div className="absolute top-1/2 w-10 h-px bg-slate-300 -translate-y-1/2 -right-10" />
      </>
    )}

    <div className={`w-56 bg-white rounded-2xl shadow-sm border-2 transition-all overflow-hidden ${match.winner ? 'border-emerald-100 shadow-emerald-100/20' : 'border-slate-100'} ${isCenter ? 'ring-4 ring-primary/10 border-primary/20 scale-110 z-10' : ''}`}>
      {match.participants.map((p, pIdx) => {
        const isBye = !p && (match.id.startsWith('w-m-0') || !match.id.includes('-m-'));
        const seed = match.seeds ? match.seeds[pIdx] : null;

        return (
          <button
            key={pIdx}
            disabled={!p || match.winner === p}
            onClick={() => onSelectWinner(match.id, p)}
            className={`w-full p-3 text-left flex items-center justify-between group transition-all relative ${pIdx === 0 ? 'border-b border-slate-50' : ''} ${match.winner === p ? 'bg-emerald-50 text-emerald-700 font-bold' : p ? 'hover:bg-slate-50 text-slate-600' : 'text-slate-300 italic bg-slate-50/30'}`}
          >
            <div className="flex items-center gap-3 truncate">
              {p && (
                <div className="flex items-center gap-2 truncate">
                  {seed && (
                    <span className="text-[10px] font-black text-slate-300 w-4">{seed}</span>
                  )}
                  <motion.div
                    layoutId={`${match.id}-${p}`}
                    className={`w-2 h-2 rounded-full ${match.winner === p ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  />
                </div>
              )}
              <span className="truncate text-xs font-bold">{p || (isBye ? 'BYE' : 'Waiting...')}</span>
            </div>
            {match.winner === p && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Trophy size={12} className="text-emerald-500" />
              </motion.div>
            )}
            {!match.winner && p && (
              <ChevronRight size={12} className={`text-slate-300 opacity-0 group-hover:opacity-100 transition-all ${mirrored ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            )}
          </button>
        );
      })}
    </div>

    {match.nextMatchId && !hideNextLine && (
      <div className={`absolute top-1/2 w-10 h-px bg-slate-300 -translate-y-1/2 group-hover/match:bg-primary/50 transition-colors ${mirrored ? '-left-10' : '-right-10'}`} />
    )}
  </div>
);

const ChampionNode = ({ winner }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-8 mb-4">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`p-6 bg-white rounded-[2.5rem] shadow-xl border-4 flex flex-col items-center gap-4 text-center min-w-[240px] transition-all duration-500 ${winner ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-slate-100'}`}
    >
      <div className="text-center">
        <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Tournament Champion</h3>
      </div>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner transition-all duration-500 ${winner ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 scale-110' : 'bg-slate-50 text-slate-300'}`}>
        <Trophy size={32} className={winner ? 'drop-shadow-lg' : ''} />
      </div>
      <div className="space-y-1">
        {winner ? (
          <>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Victory!</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {winner}
            </h2>
          </>
        ) : (
          <>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waiting for Final...</p>
            <h2 className="text-3xl font-black text-slate-200 tracking-tight italic">
              ???
            </h2>
          </>
        )}
      </div>
      {winner && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pt-2"
        >
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="#fbbf24" className="text-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  </div>
);
