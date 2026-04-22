import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, ZoomIn, ZoomOut, Maximize2, 
  Trash2, Clock, ChevronLeft, ChevronRight, Info,
  History
} from 'lucide-react';

// Native Date Helpers
const formatDate = (date, formatStr) => {
  if (formatStr === 'yyyy-MM-dd') return date.toISOString().split('T')[0];
  const year = date.getFullYear();
  return `${year}`;
};

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + Math.floor(years));
  const remainingFraction = years % 1;
  if (remainingFraction !== 0) {
    result.setTime(result.getTime() + remainingFraction * 365.25 * 24 * 60 * 60 * 1000);
  }
  return result;
};

const differenceInYears = (dateLeft, dateRight) => {
  return (dateLeft.getTime() - dateRight.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

const startOfYear = (date) => {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const StudentTimeline = () => {
  const [events, setEvents] = useState([
    { 
      id: 1, 
      date: new Date('1900-01-01'), 
      title: 'Historical Event', 
      description: 'The start of the 20th century.', 
      color: '#3b82f6' 
    }
  ]);
  
  const [viewportDate, setViewportDate] = useState(new Date('1950-01-01'));
  const [zoom, setZoom] = useState(200); // pixels per year
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '2000-01-01', color: '#3b82f6' });
  
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  // Constants
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 2000;

  // Calculate position based on date
  const getX = (date) => {
    const diff = differenceInYears(date, viewportDate);
    return diff * zoom;
  };

  // Calculate date based on X
  const getDateFromX = (x) => {
    const years = x / zoom;
    return addYears(viewportDate, years);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title) return;

    const event = {
      id: Date.now(),
      title: newEvent.title,
      description: newEvent.description,
      date: new Date(newEvent.date),
      color: newEvent.color
    };

    setEvents(prev => [...prev, event].sort((a, b) => a.date - b.date));
    setIsAdding(false);
    setNewEvent({ title: '', description: '', date: '2000-01-01', color: '#3b82f6' });
  };

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const zoomToFit = () => {
    if (events.length === 0) return;
    
    const dates = events.map(e => e.date.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const diff = Math.max(0.1, differenceInYears(maxDate, minDate));
    const containerWidth = containerRef.current?.offsetWidth || 800;
    
    const padding = 150; // pixels
    const newZoom = (containerWidth - padding) / diff;
    
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
    setViewportDate(addYears(minDate, diff / 2));
  };

  const handleDrag = (event, info) => {
    const yearsMoved = -info.delta.x / zoom;
    setViewportDate(prev => addYears(prev, yearsMoved));
  };

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col gap-6 px-6 py-8 select-none overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <History size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Student Timeline</h2>
            <p className="text-slate-400 font-medium italic">Map out events and discover history.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex items-center gap-2">
            <button 
              onClick={() => setZoom(z => Math.max(MIN_ZOOM, z * 0.8))}
              className="p-3 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all"
            >
              <ZoomOut size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <button 
              onClick={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.2))}
              className="p-3 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all"
            >
              <ZoomIn size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <button 
              onClick={zoomToFit}
              className="p-3 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all"
              title="Zoom to Fit"
            >
              <Maximize2 size={20} />
            </button>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-3 font-black tracking-wide"
          >
            <Plus size={24} />
            ADD EVENT
          </button>
        </div>
      </div>

      {/* Timeline Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden border-8 border-white group"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px)`,
            backgroundSize: `${zoom}px 100%`,
            backgroundPosition: `${getX(viewportDate) % zoom}px 0`
          }} 
        />

        {/* Date Markers */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(20)].map((_, i) => {
            const offset = i - 10;
            const markerDate = addYears(viewportDate, offset);
            const x = getX(markerDate) + (containerRef.current?.offsetWidth || 800) / 2;
            
            // Only show meaningful markers based on zoom
            if (zoom < 50 && offset % 10 !== 0) return null;
            if (zoom < 10 && offset % 50 !== 0) return null;

            return (
              <div 
                key={offset}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${x}px` }}
              >
                <div className="h-full w-px bg-white/5" />
                <span className="absolute bottom-6 text-[10px] font-black text-white/20 whitespace-nowrap uppercase tracking-widest">
                   {markerDate.getFullYear()}
                </span>
              </div>
            );
          })}
        </div>

        {/* The Actual Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -translate-y-1/2 z-0" />

        {/* Interaction Surface */}
        <motion.div 
          ref={timelineRef}
          drag="x"
          onDrag={handleDrag}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
        >
          {/* Events Container (Centered in viewport) */}
          <div 
            className="relative h-full w-full pointer-events-none"
            style={{ transform: `translateX(${(containerRef.current?.offsetWidth || 800)/2}px)` }}
          >
            <AnimatePresence mode="popLayout">
              {events.map((event) => {
                const x = getX(event.date);
                const isTop = event.id % 2 === 0;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.5, y: isTop ? -20 : 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-1/2 pointer-events-auto"
                    style={{ left: `${x}px` }}
                  >
                    {/* Stem */}
                    <div 
                      className={`absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent to-white/20`} 
                      style={{ 
                        height: isTop ? '120px' : '120px',
                        top: isTop ? '-120px' : '0',
                        backgroundImage: `linear-gradient(${isTop ? 'to top' : 'to bottom'}, ${event.color}, transparent)`
                      }}
                    />

                    {/* Card */}
                    <div 
                      className={`relative w-64 -translate-x-1/2 ${isTop ? '-translate-y-[140px]' : 'translate-y-[20px]'} bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl hover:bg-white/20 transition-all group/card`}
                      style={{ borderTop: isTop ? `4px solid ${event.color}` : 'none', borderBottom: !isTop ? `4px solid ${event.color}` : 'none' }}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{event.date.getFullYear()}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                          className="text-white/0 group-hover/card:text-red-400 p-1 hover:bg-red-400/20 rounded-lg transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <h4 className="text-lg font-black text-white mb-1 leading-tight">{event.title}</h4>
                      <p className="text-sm text-white/70 font-medium leading-relaxed italic line-clamp-3">{event.description}</p>
                    </div>

                    {/* Node */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-20 transition-transform group-hover:scale-125"
                      style={{ backgroundColor: event.color }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Viewport Overlay Controls */}
        <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-3">
           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center gap-3 text-white">
              <Clock size={16} className="text-blue-400" />
              <span className="text-xs font-black uppercase tracking-widest">{viewportDate.getFullYear()}</span>
           </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-8 left-8 z-20 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 pointer-events-none">
          <div className="flex items-center gap-3 text-white/60">
            <Info size={16} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Click and drag to scroll • Use zoom buttons</span>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">Add History Event</h3>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                    <input 
                      type="text"
                      autoFocus
                      placeholder="What happened?"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                      value={newEvent.title}
                      onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      type="date"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                      value={newEvent.date}
                      onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      placeholder="Add some details..."
                      rows={3}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700 resize-none"
                      value={newEvent.description}
                      onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marker Color</label>
                    <div className="flex gap-2">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, color: c })}
                          className={`w-10 h-10 rounded-full border-4 transition-all ${newEvent.color === c ? 'border-blue-100 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all font-black text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-black text-xs uppercase tracking-widest"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
