import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sparkles,
  Award,
  RotateCcw,
  Sliders,
  Check,
  Lock,
  ChevronRight,
  HelpCircle,
  Undo2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useHeader } from '../../contexts/HeaderContext';
import { audioEngine } from '../../utils/audio';
import { ToolPanel } from '../shared/ToolPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { FormattedMessage, useIntl } from 'react-intl';

// 1. Interfaces & Types
interface StudentCustomization {
  stars: number;
  totalStars?: number;
  ownedBadges: string[];
  activeBadges?: string[];
  ownedBackgrounds?: string[];
  backgroundStyle: string;
  ownedBorders?: string[];
  borderStyle: string;
  ownedTextStyles?: string[];
  textStyle: string;
}

interface StarChartState {
  [classId: string]: {
    [studentName: string]: StudentCustomization;
  };
}

interface ShopItem {
  id: string;
  name: string;
  cost: number;
}

interface BadgeItem extends ShopItem {
  emoji: string;
}

interface StyleItem extends ShopItem {
  style: React.CSSProperties;
}

// 2. Constants & Data
const BADGES: BadgeItem[] = [
  { id: 'badge_unicorn', name: 'Unicorn', cost: 5, emoji: '🦄' },
  { id: 'badge_trex', name: 'T-Rex', cost: 5, emoji: '🦖' },
  { id: 'badge_rocket', name: 'Rocket', cost: 5, emoji: '🚀' },
  { id: 'badge_pizza', name: 'Pizza', cost: 5, emoji: '🍕' },
  { id: 'badge_cat', name: 'Cat', cost: 5, emoji: '🐱' },
  { id: 'badge_dog', name: 'Dog', cost: 5, emoji: '🐶' },
  { id: 'badge_lion', name: 'Lion', cost: 8, emoji: '🦁' },
  { id: 'badge_panda', name: 'Panda', cost: 8, emoji: '🐼' },
  { id: 'badge_crown', name: 'Crown', cost: 10, emoji: '👑' },
  { id: 'badge_lightning', name: 'Flash', cost: 10, emoji: '⚡' },
  { id: 'badge_alien', name: 'Alien', cost: 12, emoji: '👾' },
  { id: 'badge_dragon', name: 'Dragon', cost: 15, emoji: '🐉' },
  { id: 'badge_rainbow', name: 'Rainbow', cost: 15, emoji: '🌈' },
  { id: 'badge_diamond', name: 'Diamond', cost: 20, emoji: '💎' },
  { id: 'badge_earth', name: 'Earth', cost: 20, emoji: '🌍' },
  { id: 'badge_ufo', name: 'UFO', cost: 25, emoji: '🛸' },
  { id: 'badge_hero', name: 'Hero', cost: 30, emoji: '🦸' }
];

const BACKGROUNDS: StyleItem[] = [
  { id: 'default', name: 'Default', cost: 0, style: { backgroundColor: 'var(--color-surface)' } },
  { id: 'sky_blue', name: 'Sky Blue', cost: 3, style: { backgroundColor: 'var(--color-info-bg)' } },
  { id: 'rose_pink', name: 'Rose Pink', cost: 3, style: { backgroundColor: 'var(--color-caution-bg)' } },
  { id: 'mint_green', name: 'Mint Green', cost: 3, style: { backgroundColor: 'var(--color-success-bg)' } },
  { id: 'sunny_yellow', name: 'Sunny Yellow', cost: 3, style: { backgroundColor: 'var(--color-warning-bg)' } },
  { id: 'lavender_purple', name: 'Lavender', cost: 5, style: { backgroundColor: 'var(--diamond-amazing-color)' } },
  { id: 'sunset_orange', name: 'Sunset', cost: 5, style: { backgroundColor: 'var(--color-accent)' } },
  { id: 'deep_space', name: 'Space', cost: 10, style: { backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)' } },
  { id: 'gold_glitz', name: 'Gold', cost: 15, style: { background: 'linear-gradient(135deg, var(--color-warning-bg) 0%, var(--color-accent) 100%)' } },
  { id: 'cotton_candy', name: 'Candy', cost: 15, style: { background: 'linear-gradient(135deg, var(--color-caution-bg) 0%, var(--color-info-bg) 100%)' } },
  { id: 'northern_lights', name: 'Aurora', cost: 20, style: { background: 'linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-info-bg) 50%, var(--diamond-amazing-color) 100%)' } },
  { id: 'royal_velvet', name: 'Velvet', cost: 25, style: { background: 'linear-gradient(135deg, var(--color-info-text) 0%, var(--diamond-amazing-color) 100%)', color: 'var(--color-white)' } }
];

const BORDERS: StyleItem[] = [
  { id: 'default', name: 'Solid Black', cost: 0, style: { borderStyle: 'solid', borderWidth: 'var(--border-width-card)', borderColor: 'var(--color-neutral-900)' } },
  { id: 'blue_dashed', name: 'Sky Dash', cost: 3, style: { borderStyle: 'dashed', borderWidth: 'var(--border-width-card)', borderColor: 'var(--color-primary)' } },
  { id: 'pink_double', name: 'Double Rose', cost: 5, style: { borderStyle: 'double', borderWidth: 'calc(var(--border-width-card) * 1.5)', borderColor: 'var(--color-caution-text)' } },
  { id: 'teal_thick', name: 'Teal Block', cost: 5, style: { borderStyle: 'solid', borderWidth: 'calc(var(--border-width-card) * 1.5)', borderColor: 'var(--color-success-text)' } },
  { id: 'purple_dotted', name: 'Lavender Dot', cost: 8, style: { borderStyle: 'dotted', borderWidth: 'calc(var(--border-width-card) * 1.25)', borderColor: 'var(--diamond-amazing-color)' } },
  { id: 'fire_orange', name: 'Fire Orange', cost: 10, style: { borderStyle: 'solid', borderWidth: 'var(--border-width-card)', borderColor: 'var(--color-accent)' } },
  { id: 'gold_trim', name: 'Gold Trim', cost: 15, style: { borderStyle: 'solid', borderWidth: 'calc(var(--border-width-card) * 1.25)', borderColor: 'var(--color-warning-text)' } },
  { id: 'royal_indigo', name: 'Royal Indigo', cost: 20, style: { borderStyle: 'solid', borderWidth: 'calc(var(--border-width-card) * 1.25)', borderColor: 'var(--color-info-text)' } }
];

const TEXT_STYLES: StyleItem[] = [
  { id: 'default', name: 'Default', cost: 0, style: { fontFamily: 'inherit', fontWeight: '900', color: 'var(--color-text)' } },
  { id: 'playful_blue', name: 'Blue Comic', cost: 3, style: { color: 'var(--color-info-text)', fontWeight: '900' } },
  { id: 'sweet_pink', name: 'Pink Bubble', cost: 3, style: { color: 'var(--color-caution-text)', fontWeight: '900' } },
  { id: 'neon_lime', name: 'Lime Neon', cost: 5, style: { color: 'var(--color-success-text)', fontWeight: '900' } },
  { id: 'royal_indigo_t', name: 'Royal Indigo', cost: 5, style: { color: 'var(--color-info-text)', fontWeight: '900' } },
  { id: 'retro_mono', name: 'Retro Pixel', cost: 8, style: { fontFamily: 'monospace', color: 'var(--color-success-text)', fontWeight: '900' } },
  { id: 'bubblegum', name: 'Bubblegum', cost: 10, style: { color: 'var(--color-caution-text)', textTransform: 'uppercase', letterSpacing: '0.05em' } },
  { id: 'golden_hero', name: 'Super Hero', cost: 15, style: { color: 'var(--color-warning-text)', textTransform: 'uppercase', fontStyle: 'italic' } }
];

// Helper positions for up to 6 badges around card edges (avoiding middle left/right)
const BADGE_POSITIONS = [
  'top-1 left-1',                     // Top-Left
  'top-1 right-1',                    // Top-Right
  'bottom-1 left-1',                  // Bottom-Left
  'bottom-1 right-1',                 // Bottom-Right
  'top-1 left-1/2 -translate-x-1/2',  // Top-Center
  'bottom-1 left-1/2 -translate-x-1/2' // Bottom-Center
];

const DEFAULT_CUSTOMIZATION: StudentCustomization = {
  stars: 0,
  totalStars: 0,
  ownedBadges: [],
  activeBadges: [],
  ownedBackgrounds: ['default'],
  backgroundStyle: 'default',
  ownedBorders: ['default'],
  borderStyle: 'default',
  ownedTextStyles: ['default'],
  textStyle: 'default'
};

  export const StarChart = () => {
    const { settings } = useSettings();
    const {
      setHeaderActions,
      setHeaderInfo,
      setHelpContent,
      setOnReset,
      clearHeader
    } = useHeader();
    const intl = useIntl();
  
    // 3. States & Persistence Hooks
    const [selectedClassId, setSelectedClassId] = useState<string>(() => {
      try {
        const saved = window.localStorage.getItem('star_chart_active_class_id');
        if (saved) return saved;
      } catch { /* ignore */ }
      return settings.classes[0]?.id || 'blank';
    });
  
    const [customizations, setCustomizations] = useState<StarChartState>(() => {
      try {
        const saved = window.localStorage.getItem('star_chart_customizations');
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
      return {};
    });
  
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [shopTab, setShopTab] = useState<'badges' | 'backgrounds' | 'borders' | 'text'>('badges');
    const [previewItem, setPreviewItem] = useState<{ category: string; id: string } | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(() =>
      typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );
    const [currentPage, setCurrentPage] = useState<number>(1);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  
    const activeClass = useMemo(() => {
      return settings.classes.find(c => c.id === selectedClassId) || null;
    }, [settings.classes, selectedClassId]);
  
    const studentsList = useMemo(() => {
      const list = activeClass?.students || [];
      return [...list].sort((a, b) => a.localeCompare(b));
    }, [activeClass]);
  
    const ITEMS_PER_PAGE = itemsPerPage;
    const totalPages = Math.ceil(studentsList.length / ITEMS_PER_PAGE) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  
    const paginatedStudents = useMemo(() => {
      return studentsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [studentsList, startIndex, ITEMS_PER_PAGE]);
  
    // Adjust current page if it is out of bounds due to class changes
    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [studentsList.length, totalPages, currentPage]);
  
    const updateItemsPerPage = useCallback(() => {
      if (!gridContainerRef.current) return;
      const containerHeight = gridContainerRef.current.clientHeight - 20; // Deduct 20px padding safety margin
      const width = window.innerWidth;
      const isMobileView = width < 1024;
      setIsMobile(isMobileView);
  
      if (isMobileView) {
        const cardHeight = 118;
        const gap = 14;
        const maxRows = Math.max(1, Math.floor((containerHeight + gap) / (cardHeight + gap)));
        setItemsPerPage(maxRows * 2);
      } else {
        const cardHeight = 85;
        const gap = 14;
        const maxRows = Math.max(1, Math.floor((containerHeight + gap) / (cardHeight + gap)));
        setItemsPerPage(maxRows * 4);
      }
    }, []);
  
    // Adjust resize for responsive layouts and calculate dynamic rows
    useEffect(() => {
      updateItemsPerPage();
  
      const resizeObserver = new ResizeObserver(() => {
        updateItemsPerPage();
      });
  
      if (gridContainerRef.current) {
        resizeObserver.observe(gridContainerRef.current);
      }
  
      window.addEventListener('resize', updateItemsPerPage);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateItemsPerPage);
      };
    }, [updateItemsPerPage, selectedClassId, studentsList.length]);
  
    // Save states
    useEffect(() => {
      try {
        window.localStorage.setItem('star_chart_active_class_id', selectedClassId);
      } catch { /* ignore */ }
    }, [selectedClassId]);
  
    // Reset page when class changes
    useEffect(() => {
      setCurrentPage(1);
    }, [selectedClassId]);
  
    useEffect(() => {
      try {
        window.localStorage.setItem('star_chart_customizations', JSON.stringify(customizations));
      } catch { /* ignore */ }
    }, [customizations]);
  
    // Get customize properties for a student with backward-compatible migrations
    const getCustomization = useCallback((studentName: string): StudentCustomization => {
      const classData = customizations[selectedClassId];
      const raw = (classData && classData[studentName]) || DEFAULT_CUSTOMIZATION;
  
      const ownedBadges = raw.ownedBadges || [];
      const activeBadges = raw.activeBadges || [...ownedBadges];
      const ownedBackgrounds = raw.ownedBackgrounds || ['default'];
      if (!ownedBackgrounds.includes(raw.backgroundStyle || 'default')) {
        ownedBackgrounds.push(raw.backgroundStyle || 'default');
      }
      const ownedBorders = raw.ownedBorders || ['default'];
      if (!ownedBorders.includes(raw.borderStyle || 'default')) {
        ownedBorders.push(raw.borderStyle || 'default');
      }
      const ownedTextStyles = raw.ownedTextStyles || ['default'];
      if (!ownedTextStyles.includes(raw.textStyle || 'default')) {
        ownedTextStyles.push(raw.textStyle || 'default');
      }
  
      return {
        stars: raw.stars,
        totalStars: raw.totalStars !== undefined ? raw.totalStars : raw.stars,
        ownedBadges,
        activeBadges,
        ownedBackgrounds,
        backgroundStyle: raw.backgroundStyle || 'default',
        ownedBorders,
        borderStyle: raw.borderStyle || 'default',
        ownedTextStyles,
        textStyle: raw.textStyle || 'default'
      };
    }, [customizations, selectedClassId]);
  
  
    // Click to remove badge emoji, but keep in owned list
    const handleRemoveBadge = useCallback((studentName: string, emoji: string) => {
      setCustomizations(prev => {
        const updated = { ...prev };
        const classData = updated[selectedClassId] ? { ...updated[selectedClassId] } : {};
        const current = getCustomization(studentName);
  
        current.activeBadges = (current.activeBadges || []).filter(e => e !== emoji);
  
        classData[studentName] = current;
        updated[selectedClassId] = classData;
        return updated;
      });
      audioEngine.playTick(settings.soundTheme);
    }, [selectedClassId, getCustomization, settings.soundTheme]);
  
    // Award stars to a student
    const handleAdjustStars = useCallback((studentName: string, delta: number) => {
      setCustomizations(prev => {
        const updated = { ...prev };
        const classData = updated[selectedClassId] ? { ...updated[selectedClassId] } : {};
        const current = classData[studentName] ? { ...classData[studentName] } : { ...DEFAULT_CUSTOMIZATION };
  
        // Migrate existing customizations that don't have totalStars
        if (current.totalStars === undefined) {
          current.totalStars = current.stars;
        }
  
        if (delta > 0) {
          current.stars += delta;
          current.totalStars += delta;
        } else {
          current.stars = Math.max(0, current.stars + delta);
          current.totalStars = Math.max(0, current.totalStars + delta);
        }
  
        classData[studentName] = current;
        updated[selectedClassId] = classData;
        return updated;
      });
      audioEngine.playTick(settings.soundTheme);
    }, [selectedClassId, settings.soundTheme]);
  
    // Reset stars & customizations for class
    const triggerResetClass = useCallback(() => {
      if (selectedClassId === 'blank' || studentsList.length === 0) return;
      if (!window.confirm('Are you sure you want to reset all stars and customizations for this class?')) return;
      setCustomizations(prev => {
        const updated = { ...prev };
        const classData = { ...updated[selectedClassId] };
        studentsList.forEach(student => {
          classData[student] = { ...DEFAULT_CUSTOMIZATION };
        });
        updated[selectedClassId] = classData;
        return updated;
      });
      setSelectedStudent(null);
      setPreviewItem(null);
      audioEngine.playTick(settings.soundTheme);
    }, [selectedClassId, studentsList, settings.soundTheme]);
  
    // Play a reward success melody
    const playRewardSuccessSound = useCallback(() => {
      audioEngine.playTone(523.25, 0.08, 'sine', 0.2); // C5
      setTimeout(() => audioEngine.playTone(659.25, 0.08, 'sine', 0.2), 80); // E5
      setTimeout(() => audioEngine.playTone(783.99, 0.15, 'sine', 0.2), 160); // G5
    }, []);
  
    // Header info configurations
    useEffect(() => {
      setOnReset(() => triggerResetClass);

      setHeaderInfo(
        <div className="space-y-4 font-['Outfit'] text-neutral-800">
          <h3 className="text-lg font-black uppercase tracking-tight italic">
            <FormattedMessage id="starchart.info.title" defaultMessage="Tool Information" />
          </h3>
          <p className="text-xs font-semibold leading-relaxed">
            <FormattedMessage id="starchart.info.context" defaultMessage="The Star Chart is a powerful visual rewards engine designed to gamify good behavior and goal achievement. By earning stars, children practice simple financial literacy and spending decisions in a controlled, supportive environment. The customization element gives students deep ownership and pride over their digital identity inside the classroom." />
          </p>
          <h3 className="text-lg font-black uppercase tracking-tight italic">
            <FormattedMessage id="starchart.info.about_title" defaultMessage="About" />
          </h3>
          <p className="text-xs font-semibold leading-relaxed">
            <FormattedMessage id="starchart.info.about" defaultMessage="By default, every student begins with 0 stars, a plain white card background, standard dark outline borders, and zero emoji badges. All items in the store can be unlocked with stars." />
          </p>
        </div>
      );

      setHelpContent(
        <div className="space-y-4 text-xs font-bold text-neutral-600 font-['Outfit']">
          <p className="text-sm font-black uppercase tracking-tight italic text-neutral-800">
            <FormattedMessage id="starchart.help.title" defaultMessage="How to use Star Chart:" />
          </p>
          <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
            <li><FormattedMessage id="starchart.help.step1" defaultMessage="<strong>Award Stars:</strong> Click the small plus (+ ⭐) or minus (- ⭐) buttons on any student card to award stars." values={{ strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> }} /></li>
            <li><FormattedMessage id="starchart.help.step2" defaultMessage="<strong>Select a Student:</strong> Click on a student's name card to select them for shopping. Their card will highlight." values={{ strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> }} /></li>
            <li><FormattedMessage id="starchart.help.step3" defaultMessage="<strong>Preview Items:</strong> Tap any affordable item in the shop at the bottom. It temporarily applies to the student's card." values={{ strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> }} /></li>
            <li><FormattedMessage id="starchart.help.step4" defaultMessage="<strong>Confirm Buy:</strong> Tap the same item a second time to purchase it! Stars will be deducted immediately. There are no refunds." values={{ strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> }} /></li>
          </ol>
        </div>
      );  
      setHeaderActions(
        <div className="flex items-center gap-4 italic font-['Outfit']">
          <div className="flex bg-surface p-1.5 rounded-[var(--radius-card)] border-2 border-neutral-900">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudent(null);
                setPreviewItem(null);
                audioEngine.playTick(settings.soundTheme);
              }}
              className="px-6 py-2 bg-transparent rounded-[var(--radius-inner)] font-black text-[10px] text-neutral-800 outline-none transition-all uppercase tracking-widest cursor-pointer border-none"
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
      triggerResetClass,
      setOnReset,
      setHeaderActions,
      setHeaderInfo,
      setHelpContent,
      clearHeader,
      intl
    ]);
  
    // Shop Purchase Mechanics & Closet equipping
    const handleItemClick = (category: string, itemId: string, cost: number) => {
      if (!selectedStudent) return;
      const currentCustom = getCustomization(selectedStudent);
  
      // Closet Toggle/Equip for already owned items
      const owned = isItemOwned(selectedStudent, category, itemId);
  
      if (owned) {
        setCustomizations(prev => {
          const updated = { ...prev };
          const classData = updated[selectedClassId] ? { ...updated[selectedClassId] } : {};
          const current = getCustomization(selectedStudent);
  
          if (category === 'badges') {
            const badge = BADGES.find(b => b.id === itemId);
            if (badge) {
              const activeBadges = current.activeBadges || [];
              if (activeBadges.includes(badge.emoji)) {
                // Unequip it
                current.activeBadges = activeBadges.filter(e => e !== badge.emoji);
              } else {
                // Equip it (up to 8 badges)
                if (activeBadges.length < 8) {
                  current.activeBadges = [...activeBadges, badge.emoji];
                } else {
                  current.activeBadges = [...activeBadges.slice(1), badge.emoji];
                }
              }
            }
          } else if (category === 'backgrounds') {
            current.backgroundStyle = current.backgroundStyle === itemId ? 'default' : itemId;
          } else if (category === 'borders') {
            current.borderStyle = current.borderStyle === itemId ? 'default' : itemId;
          } else if (category === 'text') {
            current.textStyle = current.textStyle === itemId ? 'default' : itemId;
          }
  
          classData[selectedStudent] = current;
          updated[selectedClassId] = classData;
          return updated;
        });
  
        audioEngine.playTick(settings.soundTheme);
        return;
      }
  
      // Guard: affordable check
      if (currentCustom.stars < cost) {
        audioEngine.playTick(settings.soundTheme); // Error sound or normal tick
        return;
      }
  
      // Toggle Preview or Buy
      if (previewItem && previewItem.category === category && previewItem.id === itemId) {
        // PURCHASE IT! (Click twice)
        setCustomizations(prev => {
          const updated = { ...prev };
          const classData = updated[selectedClassId] ? { ...updated[selectedClassId] } : {};
          const current = getCustomization(selectedStudent);
  
          current.stars = Math.max(0, current.stars - cost);
          if (category === 'badges') {
            const badge = BADGES.find(b => b.id === itemId);
            if (badge) {
              if (!current.ownedBadges.includes(badge.emoji)) {
                current.ownedBadges = [...current.ownedBadges, badge.emoji];
              }
              const activeBadges = current.activeBadges || [];
              if (!activeBadges.includes(badge.emoji)) {
                if (activeBadges.length < 8) {
                  current.activeBadges = [...activeBadges, badge.emoji];
                } else {
                  current.activeBadges = [...activeBadges.slice(1), badge.emoji];
                }
              }
            }
          } else if (category === 'backgrounds') {
            const ownedBgs = current.ownedBackgrounds || ['default'];
            if (!ownedBgs.includes(itemId)) {
              current.ownedBackgrounds = [...ownedBgs, itemId];
            }
            current.backgroundStyle = itemId;
          } else if (category === 'borders') {
            const ownedBorders = current.ownedBorders || ['default'];
            if (!ownedBorders.includes(itemId)) {
              current.ownedBorders = [...ownedBorders, itemId];
            }
            current.borderStyle = itemId;
          } else if (category === 'text') {
            const ownedTexts = current.ownedTextStyles || ['default'];
            if (!ownedTexts.includes(itemId)) {
              current.ownedTextStyles = [...ownedTexts, itemId];
            }
            current.textStyle = itemId;
          }
  
          classData[selectedStudent] = current;
          updated[selectedClassId] = classData;
          return updated;
        });
  
        setPreviewItem(null);
        playRewardSuccessSound();
      } else {
        // Enter preview
        setPreviewItem({ category, id: itemId });
        audioEngine.playTick(settings.soundTheme);
      }
    };
  
    // Check if student owns style already
    const isItemOwned = (studentName: string, category: string, itemId: string): boolean => {
      const custom = getCustomization(studentName);
      if (category === 'badges') {
        const badge = BADGES.find(b => b.id === itemId);
        return badge ? custom.ownedBadges.includes(badge.emoji) : false;
      }
      if (category === 'backgrounds') {
        return (custom.ownedBackgrounds || ['default']).includes(itemId) || itemId === 'default';
      }
      if (category === 'borders') {
        return (custom.ownedBorders || ['default']).includes(itemId) || itemId === 'default';
      }
      if (category === 'text') {
        return (custom.ownedTextStyles || ['default']).includes(itemId) || itemId === 'default';
      }
      return false;
    };
  
    // Check if style or badge is currently active
    const isItemActive = (studentName: string, category: string, itemId: string): boolean => {
      const custom = getCustomization(studentName);
      if (category === 'badges') {
        const badge = BADGES.find(b => b.id === itemId);
        return badge ? (custom.activeBadges || []).includes(badge.emoji) : false;
      }
      if (category === 'backgrounds') return custom.backgroundStyle === itemId;
      if (category === 'borders') return custom.borderStyle === itemId;
      if (category === 'text') return custom.textStyle === itemId;
      return false;
    };
  
    // Render variables for active student customization, overlayed with previews
    const getRenderStyles = (studentName: string) => {
      const custom = getCustomization(studentName);
      let bgId = custom.backgroundStyle;
      let borderId = custom.borderStyle;
      let textId = custom.textStyle;
  
      // Apply preview if active
      if (selectedStudent === studentName && previewItem) {
        if (previewItem.category === 'backgrounds') bgId = previewItem.id;
        if (previewItem.category === 'borders') borderId = previewItem.id;
        if (previewItem.category === 'text') textId = previewItem.id;
      }
  
      const bgObj = BACKGROUNDS.find(b => b.id === bgId) || BACKGROUNDS[0];
      const borderObj = BORDERS.find(b => b.id === borderId) || BORDERS[0];
      const textObj = TEXT_STYLES.find(t => t.id === textId) || TEXT_STYLES[0];
  
      const cardStyles: React.CSSProperties = {
        ...bgObj.style,
        ...borderObj.style,
      };
  
      const textStyles: React.CSSProperties = {
        ...textObj.style,
      };
  
      // Equipped badges display
      let displayBadges = custom.activeBadges ? [...custom.activeBadges] : [...custom.ownedBadges];
      if (selectedStudent === studentName && previewItem && previewItem.category === 'badges') {
        const previewBadge = BADGES.find(b => b.id === previewItem.id);
        if (previewBadge && !displayBadges.includes(previewBadge.emoji)) {
          if (displayBadges.length < 8) {
            displayBadges.push(previewBadge.emoji);
          } else {
            displayBadges = [...displayBadges.slice(1), previewBadge.emoji];
          }
        }
      }
  
      return { cardStyles, textStyles, displayBadges };
    };
  
    const activeCustom = selectedStudent ? getCustomization(selectedStudent) : null;
  
    return (
      <div className="flex flex-col lg:flex-row h-full w-full italic overflow-hidden transition-all duration-500 ease-in-out gap-6 font-['Outfit'] select-none relative">
  
        {/* ========================================================
            RIGHT: MAIN CONTENT (Student Grid & Shop at the Bottom)
            ======================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden gap-4 flex">

        
        {/* Main Student Board */}
        <ToolPanel alignTop={true} className="flex-1 p-4 flex flex-col relative overflow-hidden h-full order-1 lg:order-2" fluid={true} baseWidth={isMobile ? 450 : 900} baseHeight={800}>
          {selectedClassId === 'blank' || studentsList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-neutral-100 border-4 border-neutral-900 rounded-full flex items-center justify-center text-3xl mb-4">⭐</div>
              <h3 className="text-lg font-black text-neutral-800 uppercase tracking-wider mb-2">
                <FormattedMessage id="starchart.board.empty.title" defaultMessage="Ready to award stars?" />
              </h3>
              <p className="text-xs text-neutral-500 font-bold max-w-sm">
                <FormattedMessage id="starchart.board.empty.desc" defaultMessage="Please load a class with student names from the Class selector at the top to start tracking rewards!" />
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
              <div ref={gridContainerRef} className="flex-1 w-full overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 p-2.5">
                  {paginatedStudents.map((student) => {
                    const custom = getCustomization(student);
                    const isSelected = selectedStudent === student;
                    const { cardStyles, textStyles, displayBadges } = getRenderStyles(student);
                    // Ensure totalStars defaults to stars for backwards compatibility
                    const totalStars = custom.totalStars !== undefined ? custom.totalStars : custom.stars;

                    return (
                      <motion.div
                        key={student}
                        layoutId={`card-${student}`}
                        onClick={() => {
                          setSelectedStudent(prev => prev === student ? null : student);
                          setPreviewItem(null); // Clear preview when toggling selection
                          audioEngine.playTick(settings.soundTheme);
                        }}
                        className={`relative flex flex-col items-center justify-center h-[118px] lg:h-[85px] rounded-[var(--radius-inner)] transition-all cursor-pointer border-[3px] select-none ${
                          isSelected 
                            ? 'ring-4 ring-info scale-105 border-info' 
                            : 'border-neutral-900 hover:scale-[1.02] active:scale-95'
                        }`}
                        style={cardStyles}
                      >

                        {/* RED Minus Button on the Far Left */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStars(student, -1);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 lg:w-6 lg:h-6 rounded-[var(--radius-inner)] border-2 border-neutral-900 bg-caution hover:opacity-90 active:scale-90 transition-all text-white font-black text-base lg:text-xs flex items-center justify-center z-20"
                          title="Subtract 1 star"
                        >
                          -
                        </button>

                        {/* Center Content Column */}
                        <div className="flex flex-col items-center justify-between py-2 lg:py-1.5 px-10 lg:px-7 w-full h-full text-center">
                          {/* 1. Total Stars & Unspent Balance (Large and above the name) */}
                          <span className="text-lg lg:text-base font-black flex items-center justify-center gap-1.5 text-neutral-800 mb-0.5">
                            ⭐ {totalStars}
                            {custom.stars > 0 && (
                              <span className="text-[11px] lg:text-[10px] font-bold text-neutral-500">
                                ({custom.stars} {intl.formatMessage({ id: 'starchart.card.left', defaultMessage: 'left' })})
                              </span>
                            )}
                          </span>

                          {/* 2. Responsive HTML Name (Auto-wrap and scale long names) */}
                          <div className="w-full h-9 lg:h-6 flex items-center justify-center overflow-hidden">
                            {student.length > 10 ? (
                              <div 
                                className="w-full flex items-center justify-center line-clamp-2 leading-none text-center font-black uppercase"
                                style={{
                                  ...textStyles,
                                  fontSize: isMobile ? '12px' : '9.5px',
                                  lineHeight: '1.1',
                                  wordBreak: 'break-word',
                                  hyphens: 'auto'
                                }}
                              >
                                {student}
                              </div>
                            ) : (
                              <div 
                                className="w-full flex items-center justify-center truncate text-center font-black uppercase tracking-wider"
                                style={{
                                  ...textStyles,
                                  fontSize: isMobile ? '15.5px' : '12px',
                                  lineHeight: '1.2'
                                }}
                              >
                                {student}
                              </div>
                            )}
                          </div>

                          {/* 3. Badges Equipped Under Name */}
                          <div className="flex flex-wrap items-center justify-center gap-0.5 min-h-[16px] max-w-full z-20">
                            {displayBadges.map((emoji, idx) => (
                              <span
                                key={`${student}-badge-${idx}`}
                                className="text-xs transition-all filter drop-shadow-none cursor-pointer hover:scale-125 select-none"
                                title="Click to remove badge"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveBadge(student, emoji);
                                }}
                              >
                                {emoji}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* GREEN Plus Button on the Far Right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStars(student, 1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 lg:w-6 lg:h-6 rounded-[var(--radius-inner)] border-2 border-neutral-900 bg-success hover:opacity-90 active:scale-90 transition-all text-white font-black text-base lg:text-xs flex items-center justify-center z-20"
                          title="Add 1 star"
                        >
                          +
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t-2 border-neutral-100 mt-2 shrink-0 select-none">
                  <button
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage(p => p - 1);
                        audioEngine.playTick(settings.soundTheme);
                      }
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-background border-2 border-neutral-900 rounded-[var(--radius-inner)] font-black text-xs uppercase tracking-widest text-neutral-800 disabled:opacity-30 disabled:border-neutral-300 disabled:text-neutral-400 hover:bg-neutral-50 active:scale-95 transition-all"
                  >
                    {intl.formatMessage({ id: 'starchart.pagination.prev', defaultMessage: '◀ Prev' })}
                  </button>
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-bold">
                    {intl.formatMessage({ id: 'starchart.pagination.page', defaultMessage: 'Page {currentPage} of {totalPages}' }, { currentPage, totalPages })}
                  </span>
                  <button
                    onClick={() => {
                      if (currentPage < totalPages) {
                        setCurrentPage(p => p + 1);
                        audioEngine.playTick(settings.soundTheme);
                      }
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-background border-2 border-neutral-900 rounded-[var(--radius-inner)] font-black text-xs uppercase tracking-widest text-neutral-800 disabled:opacity-30 disabled:border-neutral-300 disabled:text-neutral-400 hover:bg-neutral-50 active:scale-95 transition-all"
                  >
                    {intl.formatMessage({ id: 'starchart.pagination.next', defaultMessage: 'Next ▶' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </ToolPanel>

        {/* SHOP PANEL */}
        <AnimatePresence>
          {selectedClassId !== 'blank' && studentsList.length > 0 && selectedStudent && (
            <motion.div
              initial={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { height: 'auto', opacity: 1 } : { width: window.innerWidth >= 1280 ? 350 : 320, opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-neutral-50 border-[3px] border-neutral-200 rounded-[var(--radius-main)] p-4 flex flex-col gap-4 shrink-0 order-2 lg:order-1 w-full lg:h-full lg:overflow-hidden lg:justify-start overflow-hidden"
            >
              
              {/* Shop Header Actions */}
              <div className="flex flex-col gap-3">
                
                {/* Selector details */}
                <div className="flex items-center gap-3 lg:mb-1">
                  <span className="w-10 h-10 rounded-[var(--radius-inner)] bg-accent border-[3px] border-neutral-200 flex items-center justify-center text-xl">🛒</span>
                  <div className="font-['Outfit'] leading-tight">
                    {selectedStudent ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                          <FormattedMessage id="starchart.shop.shopping_for" defaultMessage="Shopping For" />
                        </p>
                        <p className="text-xs font-black text-info uppercase tracking-widest mt-0.5">
                          {selectedStudent} <span className="text-neutral-900 font-bold ml-1">({activeCustom?.stars} ⭐ <FormattedMessage id="starchart.shop.available" defaultMessage="Available" />)</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-black text-neutral-700 uppercase tracking-wide">
                          <FormattedMessage id="starchart.shop.title" defaultMessage="Star Store" />
                        </p>
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">
                          <FormattedMessage id="starchart.shop.subtitle" defaultMessage="Select a student above to buy upgrades!" />
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Tab Selector Buttons */}
                <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-1.5 bg-neutral-200/50 p-1.5 rounded-[var(--radius-card)] border-[3px] border-neutral-200 self-start sm:self-auto w-full">
                  {(['badges', 'backgrounds', 'borders', 'text'] as const).map((tab) => {
                    const labels = {
                      badges: intl.formatMessage({ id: 'starchart.shop.tab.badges', defaultMessage: '🏷️ Badges' }),
                      backgrounds: intl.formatMessage({ id: 'starchart.shop.tab.backgrounds', defaultMessage: '🎨 Backgrounds' }),
                      borders: intl.formatMessage({ id: 'starchart.shop.tab.borders', defaultMessage: '🏁 Borders' }),
                      text: intl.formatMessage({ id: 'starchart.shop.tab.text', defaultMessage: '🔠 Text' })
                    };
                    const active = shopTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setShopTab(tab);
                          setPreviewItem(null); // Clear preview when changing tabs
                          audioEngine.playTick(settings.soundTheme);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[var(--radius-inner)] transition-all ${
                          active 
                            ? 'bg-neutral-900 text-white' 
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/50'
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Shop Content Slider */}
              <div className="h-[148px] lg:h-auto lg:flex-1 overflow-x-auto lg:overflow-y-auto overflow-y-hidden lg:overflow-x-hidden p-1 custom-scrollbar">
                <div className="grid grid-rows-2 lg:grid-rows-none grid-flow-col lg:grid-flow-row lg:grid-cols-3 gap-2.5 h-full lg:h-auto">
                  
                  {/* 1. Emoji Badges */}
                  {shopTab === 'badges' && BADGES.map((item) => {
                    const owned = selectedStudent ? isItemOwned(selectedStudent, 'badges', item.id) : false;
                    const active = selectedStudent ? isItemActive(selectedStudent, 'badges', item.id) : false;
                    const affordable = selectedStudent ? (activeCustom?.stars ?? 0) >= item.cost : false;
                    const isPreviewed = previewItem?.category === 'badges' && previewItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        disabled={!selectedStudent}
                        onClick={() => handleItemClick('badges', item.id, item.cost)}
                        className={`h-[64px] lg:h-[70px] w-[64px] lg:w-full shrink-0 border-[3px] rounded-[var(--radius-inner)] flex flex-col items-center justify-center p-1 transition-all select-none relative ${
                          !selectedStudent 
                            ? 'bg-neutral-100 border-neutral-200 opacity-50'
                            : active
                              ? 'border-info bg-info-bg'
                              : owned
                                ? 'border-neutral-300 bg-white hover:border-neutral-900 active:scale-95'
                                : isPreviewed
                                  ? 'border-info bg-info-bg animate-pulse-soft'
                                  : affordable
                                    ? 'border-success bg-success-bg/40 hover:border-success active:scale-95'
                                    : 'border-neutral-200 bg-neutral-100 opacity-80'
                        }`}
                      >
                        <span className="text-xl mb-0.5">{item.emoji}</span>
                        
                        {active ? (
                          <span className="text-[7px] font-black text-info uppercase tracking-wider flex items-center gap-0.5">
                            <Check size={6} strokeWidth={4} /> <FormattedMessage id="starchart.shop.item.active" defaultMessage="Active" />
                          </span>
                        ) : owned ? (
                          <span className="text-[7px] font-black text-neutral-500 uppercase tracking-wider">
                            <FormattedMessage id="starchart.shop.item.equip" defaultMessage="Equip" />
                          </span>
                        ) : isPreviewed ? (
                          <span className="text-[7px] font-black text-info uppercase tracking-widest animate-pulse">
                            <FormattedMessage id="starchart.shop.item.buy" defaultMessage="Buy!" />
                          </span>
                        ) : (
                          <span className={`text-[7px] font-black uppercase tracking-widest flex items-center gap-0.5 ${
                            affordable ? 'text-success' : 'text-neutral-800'
                          }`}>
                            ⭐ {item.cost}
                          </span>
                        )}

                        {!owned && selectedStudent && !affordable && (
                          <span className="absolute top-1 right-1 text-[8px] text-neutral-400"><Lock size={6} /></span>
                        )}
                      </button>
                    );
                  })}

                  {/* 2. Background Styles */}
                  {shopTab === 'backgrounds' && BACKGROUNDS.map((item) => {
                    const owned = selectedStudent ? isItemOwned(selectedStudent, 'backgrounds', item.id) : false;
                    const active = selectedStudent ? isItemActive(selectedStudent, 'backgrounds', item.id) : false;
                    const affordable = selectedStudent ? (activeCustom?.stars ?? 0) >= item.cost : false;
                    const isPreviewed = previewItem?.category === 'backgrounds' && previewItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        disabled={!selectedStudent}
                        onClick={() => handleItemClick('backgrounds', item.id, item.cost)}
                        className={`h-[64px] lg:h-[70px] w-[70px] lg:w-full shrink-0 border-[3px] rounded-[var(--radius-inner)] flex flex-col items-center justify-center p-1 transition-all select-none relative ${
                          !selectedStudent 
                            ? 'opacity-50 border-neutral-200 bg-neutral-100'
                            : active 
                              ? 'border-info'
                              : owned 
                                ? 'border-neutral-300 bg-white hover:border-neutral-900 active:scale-95'
                                : isPreviewed
                                  ? 'border-info animate-pulse-soft'
                                  : affordable
                                    ? 'border-success hover:border-success active:scale-95'
                                    : 'border-neutral-200 opacity-80'
                        }`}
                        style={{ 
                          ...item.style,
                          color: item.style.color || 'var(--color-text)',
                          borderColor: (active || isPreviewed) ? 'var(--color-info-text)' : owned ? 'var(--color-neutral-300)' : 'var(--color-neutral-200)'
                        }}
                      >
                        <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-wider mb-0.5 truncate max-w-full">
                          {item.name}
                        </span>
                        
                        {active ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-info uppercase tracking-wider flex items-center gap-0.5">
                            <Check size={6} strokeWidth={4} /> <FormattedMessage id="starchart.shop.item.active" defaultMessage="Active" />
                          </span>
                        ) : owned ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                            <FormattedMessage id="starchart.shop.item.equip" defaultMessage="Equip" />
                          </span>
                        ) : isPreviewed ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-info uppercase tracking-widest">
                            <FormattedMessage id="starchart.shop.item.buy" defaultMessage="Buy!" />
                          </span>
                        ) : (
                          <span className={`text-[7px] lg:text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 ${
                            affordable ? 'text-success' : 'text-neutral-800'
                          }`}>
                            ⭐ {item.cost}
                          </span>
                        )}

                        {!owned && selectedStudent && !affordable && (
                          <span className="absolute top-1 right-1 text-[8px] text-neutral-400"><Lock size={6} /></span>
                        )}
                      </button>
                    );
                  })}

                  {/* 3. Border Styles */}
                  {shopTab === 'borders' && BORDERS.map((item) => {
                    const owned = selectedStudent ? isItemOwned(selectedStudent, 'borders', item.id) : false;
                    const active = selectedStudent ? isItemActive(selectedStudent, 'borders', item.id) : false;
                    const affordable = selectedStudent ? (activeCustom?.stars ?? 0) >= item.cost : false;
                    const isPreviewed = previewItem?.category === 'borders' && previewItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        disabled={!selectedStudent}
                        onClick={() => handleItemClick('borders', item.id, item.cost)}
                        className={`h-[64px] lg:h-[70px] w-[70px] lg:w-full shrink-0 rounded-[var(--radius-inner)] flex flex-col items-center justify-center p-1 transition-all select-none relative bg-white ${
                          !selectedStudent 
                            ? 'opacity-50 border-neutral-200 border-[3px]'
                            : active 
                              ? 'border-[4px]'
                              : owned 
                                ? 'border-[3px] border-neutral-300 hover:border-neutral-900 active:scale-95'
                                : isPreviewed
                                  ? 'border-[4px]'
                                  : affordable
                                    ? 'border-[3px] border-neutral-200 hover:border-success active:scale-95'
                                    : 'opacity-80 border-[3px] border-neutral-100'
                        }`}
                        style={{ 
                          ...item.style,
                          borderStyle: item.style.borderStyle,
                          borderColor: (active || isPreviewed) ? 'var(--color-info-text)' : (owned ? 'var(--color-neutral-300)' : item.style.borderColor)
                        }}
                      >
                        <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-wider mb-0.5 truncate max-w-full text-neutral-900">
                          {item.name}
                        </span>
                        
                        {active ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-info uppercase tracking-wider flex items-center gap-0.5">
                            <Check size={6} strokeWidth={4} /> <FormattedMessage id="starchart.shop.item.active" defaultMessage="Active" />
                          </span>
                        ) : owned ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                            <FormattedMessage id="starchart.shop.item.equip" defaultMessage="Equip" />
                          </span>
                        ) : isPreviewed ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-info uppercase tracking-widest">
                            <FormattedMessage id="starchart.shop.item.buy" defaultMessage="Buy!" />
                          </span>
                        ) : (
                          <span className={`text-[7px] lg:text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 ${
                            affordable ? 'text-success' : 'text-neutral-800'
                          }`}>
                            ⭐ {item.cost}
                          </span>
                        )}

                        {!owned && selectedStudent && !affordable && (
                          <span className="absolute top-1 right-1 text-[8px] text-neutral-400"><Lock size={6} /></span>
                        )}
                      </button>
                    );
                  })}

                  {/* 4. Text Styles */}
                  {shopTab === 'text' && TEXT_STYLES.map((item) => {
                    const owned = selectedStudent ? isItemOwned(selectedStudent, 'text', item.id) : false;
                    const active = selectedStudent ? isItemActive(selectedStudent, 'text', item.id) : false;
                    const affordable = selectedStudent ? (activeCustom?.stars ?? 0) >= item.cost : false;
                    const isPreviewed = previewItem?.category === 'text' && previewItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        disabled={!selectedStudent}
                        onClick={() => handleItemClick('text', item.id, item.cost)}
                        className={`h-[64px] lg:h-[70px] w-[70px] lg:w-full shrink-0 border-[3px] rounded-[var(--radius-inner)] flex flex-col items-center justify-center p-1 transition-all select-none relative bg-white ${
                          !selectedStudent 
                            ? 'opacity-50 border-neutral-200'
                            : active 
                              ? 'border-info'
                              : owned 
                                ? 'border-neutral-300 hover:border-neutral-900 active:scale-95'
                                : isPreviewed
                                  ? 'border-info animate-pulse-soft'
                                  : affordable
                                    ? 'border-success hover:border-success active:scale-95'
                                    : 'border-neutral-200 opacity-80'
                        }`}
                        style={{
                          borderColor: (active || isPreviewed) ? 'var(--color-info-text)' : owned ? 'var(--color-neutral-300)' : 'var(--color-neutral-200)'
                        }}
                      >
                        <span 
                          className="text-[8px] lg:text-[9px] font-black mb-0.5 truncate max-w-full"
                          style={item.style}
                        >
                          {item.name}
                        </span>
                        
                        {active ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-info uppercase tracking-wider flex items-center gap-0.5">
                            <Check size={6} strokeWidth={4} /> <FormattedMessage id="starchart.shop.item.active" defaultMessage="Active" />
                          </span>
                        ) : owned ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                            <FormattedMessage id="starchart.shop.item.equip" defaultMessage="Equip" />
                          </span>
                        ) : isPreviewed ? (
                          <span className="text-[7px] lg:text-[8px] font-black text-info uppercase tracking-widest">
                            <FormattedMessage id="starchart.shop.item.buy" defaultMessage="Buy!" />
                          </span>
                        ) : (
                          <span className={`text-[7px] lg:text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 ${
                            affordable ? 'text-success' : 'text-neutral-800'
                          }`}>
                            ⭐ {item.cost}
                          </span>
                        )}

                        {!owned && selectedStudent && !affordable && (
                          <span className="absolute top-1 right-1 text-[8px] text-neutral-400"><Lock size={6} /></span>
                        )}
                      </button>
                    );
                  })}

                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
};

export default StarChart;
