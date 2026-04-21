"use client";

import React, { useState, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  RotateCcw,
  Shield,
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  SkipForward,
  Layers,
  Search,
  AlertTriangle,
  Gamepad2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdventureModal from "@/components/AdventureModal";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import AdventureCard from "@/components/AdventureCard";
import type { Adventure } from "@/hooks/useAdventures";
import type { AdventureOptions } from "@/lib/db";

// Fallback, если в БД нет строки adventure_options
const DEFAULT_OPTIONS: AdventureOptions = {
  base_setting: ["Реализм", "Фентези", "Фантастика", "Реализм + Фентези", "Реализм + Фантастика", "Фентези + Фантастика", "Реализм + Фентези + Фантастика"],
  setting_relations: {
    "Реализм": ["История", "Современность", "Будущее"],
    "Фентези": ["Эпическое фентези", "Темное фентези", "Сказочное фентези"],
    "Фантастика": ["Твердая НФ", "Мягкая НФ", "Космическая НФ"],
    "Реализм + Фентези": ["Городское фентези", "Фольклор", "Историческое фентези"],
    "Реализм + Фантастика": ["Стимпанк", "Ретрофутуризм", "Киберпанк"],
    "Фентези + Фантастика": ["Техномагия", "Научная фантазия", "Космоопера"],
    "Реализм + Фентези + Фантастика": ["Постапокалипсис", "Супергероика", "Странность"]
  },
  subsetting: [],
  genre: ["Экшен", "Военный", "Выживание", "Детектив", "Хоррор", "Мистика", "Драма", "Комедия", "Криминал", "Политический", "Шпионский", "Гротеск", "Катастрофа", "Путешествие"],
  universe: ["Вестерос", "Средиземье", "DnD Миры", "Тамриэль", "Город парового солнца"]
};

// Функция для нормализации строк при сравнении (ё/е, э/е)
const normalizeSetting = (s: string) =>
  s.toLowerCase()
    .replace(/ё/g, "е")
    .replace(/э/g, "е")
    .replace(/[^a-zа-я0-9]/g, "");

const normalizeForSearch = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е");

/** Примерно четыре строки кнопок-фильтров (высота ряда + отступ между рядами). */
const COLLAPSED_OPTIONS_MAX_PX = 224;

interface AdventuresClientProps {
  initialAdventures: Adventure[];
  adventureOptions?: AdventureOptions | null;
}

export default function AdventuresClient({ initialAdventures, adventureOptions }: AdventuresClientProps) {
  const opts = adventureOptions ?? DEFAULT_OPTIONS;
  const BASE_SETTINGS = opts.base_setting;
  const SETTING_RELATIONS = opts.setting_relations;
  const SUB_SETTINGS_LIST = opts.subsetting.length > 0 ? opts.subsetting : Object.values(SETTING_RELATIONS).flat();
  const FOCUS_GENRES = opts.genre;
  const WORLDS = opts.universe;

  const ADVENTURE_TYPE_OPTIONS = useMemo(() => {
    const s = new Set<string>();
    for (const a of initialAdventures) {
      if (a.adventure_type?.trim()) s.add(a.adventure_type.trim());
    }
    const arr = [...s].sort((x, y) => x.localeCompare(y, "ru"));
    return arr.length > 0 ? arr : ["Ваншот", "Приключение", "Кампания"];
  }, [initialAdventures]);

  const FILTER_STEPS = useMemo(
    () => [
      { id: "subsetting" as const, heading: "Сеттинг", icon: <Layers size={24} />, options: SUB_SETTINGS_LIST },
      { id: "base_setting" as const, heading: "Базовый сеттинг", icon: <Layers size={24} />, options: BASE_SETTINGS },
      { id: "focus" as const, heading: "Фокус игры", icon: <Shield size={24} />, options: FOCUS_GENRES },
      { id: "world" as const, heading: "Мир", icon: <Target size={24} />, options: WORLDS },
      { id: "adventure_type" as const, heading: "Тип игры", icon: <Gamepad2 size={24} />, options: ADVENTURE_TYPE_OPTIONS },
    ],
    [BASE_SETTINGS, SUB_SETTINGS_LIST, FOCUS_GENRES, WORLDS, ADVENTURE_TYPE_OPTIONS]
  );

  /** Четыре сегмента прогресс-бара: «Сеттинг» — сначала под-сеттинг, затем базовый */
  const PROGRESS_GROUPS = useMemo(
    () =>
      [
        { key: "setting" as const, barLabel: "Сеттинг", indices: [0, 1] as const, icon: <Layers size={24} /> },
        { key: "genre" as const, barLabel: "Жанр", indices: [2] as const, icon: <Shield size={24} /> },
        { key: "world" as const, barLabel: "Мир", indices: [3] as const, icon: <Target size={24} /> },
        { key: "type" as const, barLabel: "Тип игры", indices: [4] as const, icon: <Gamepad2 size={24} /> },
      ] as const,
    []
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const adventures = initialAdventures;
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [longListExpanded, setLongListExpanded] = useState(false);
  const [longListOverflows, setLongListOverflows] = useState(false);
  const optionsGridRef = useRef<HTMLDivElement>(null);

  // Очистка сообщения о конфликте при смене шага
  const handleSetStep = useCallback((step: number) => {
    setConflictMessage(null);
    setLongListExpanded(false);
    const nextStepId = FILTER_STEPS[step]?.id;
    const nextIsCollapsible = nextStepId === "focus" || nextStepId === "world";
    if (!nextIsCollapsible) setLongListOverflows(false);
    setCurrentStep(step);
  }, [FILTER_STEPS]);

  // Функция для получения значения поля из приключения
  const getAdventureFieldValue = useCallback((adv: Adventure, fieldId: string): string | string[] | null => {
    if (fieldId === "base_setting") {
      if (adv.base_setting) {
        if (Array.isArray(adv.base_setting)) return adv.base_setting;
        if (typeof adv.base_setting === 'string') {
          return adv.base_setting.split(/[,;]/).map(b => b.trim()).filter(b => b);
        }
        return [adv.base_setting];
      }
      return null;
    }
    
    if (fieldId === "subsetting") {
      return adv.subsetting || null;
    }
    
    if (fieldId === "focus") {
      return adv.focus ?? adv.genre ?? null;
    }
    
    if (fieldId === "world") {
      return adv.world ?? adv.universe ?? null;
    }

    if (fieldId === "adventure_type") {
      return adv.adventure_type ?? null;
    }

    return adv[fieldId as keyof Adventure] as string | null;
  }, []);

  // Функция для проверки соответствия приключения фильтру
  const matchesFilter = useCallback((adv: Adventure, filterKey: string, selectedValues: string[]): boolean => {
    const value = getAdventureFieldValue(adv, filterKey);
    
    if (!value) return false;
    
    if (filterKey === "base_setting") {
      const advBases = Array.isArray(value) ? value : [value];
      return selectedValues.some(selected => advBases.includes(selected));
    }
    
    if (Array.isArray(value)) {
      return selectedValues.some(selected => value.includes(selected));
    }
    
    return selectedValues.includes(value);
  }, [getAdventureFieldValue]);

  // Функция для получения доступных опций из приключений с учетом текущих фильтров
  const getAvailableOptionsFromAdventures = useCallback((fieldId: string, currentFilters: Record<string, string[]>): string[] => {
    const filtered = adventures.filter((adv) => {
      return Object.entries(currentFilters).every(([key, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0 || key === fieldId) return true;
        return matchesFilter(adv, key, selectedValues);
      });
    });
    
    const values = new Set<string>();
    filtered.forEach(adv => {
      const value = getAdventureFieldValue(adv, fieldId);
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(v));
        } else {
          values.add(value);
        }
      }
    });
    
    return Array.from(values);
  }, [adventures, getAdventureFieldValue, matchesFilter]);

  // Получаем доступные опции для текущего шага с учетом выбранных фильтров
  const currentStepData = useMemo(() => {
    const step = FILTER_STEPS[currentStep];
    let options = getAvailableOptionsFromAdventures(step.id, filters);
    if (step.id === "adventure_type" && options.length === 0) {
      options = [...step.options];
    }
    return { ...step, options };
  }, [FILTER_STEPS, currentStep, filters, getAvailableOptionsFromAdventures]);

  const filteredAdventures = useMemo(() => {
    return adventures.filter((adv) => {
      const matchesButtons = Object.entries(filters).every(([key, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        return matchesFilter(adv, key, selectedValues);
      });

      if (!matchesButtons) return false;

      if (!searchQuery.trim()) return true;

      const query = normalizeForSearch(searchQuery.trim());
      const queryWords = query.split(/\s+/).filter(Boolean);
      
      const searchableFields = [
        adv.title,
        adv.subsetting,
        adv.focus,
        adv.world,
        adv.adventure_type,
        ...(Array.isArray(adv.base_setting) ? adv.base_setting : [adv.base_setting]),
        ...(Array.isArray(adv.genre) ? adv.genre : adv.genre ? [adv.genre] : []),
      ].filter(Boolean) as string[];

      const searchableText = searchableFields.map(field => normalizeForSearch(field)).join(" ");

      return queryWords.every(word => searchableText.includes(word));
    });
  }, [adventures, filters, searchQuery, matchesFilter]);

  const toggleOption = (option: string) => {
    const stepId = currentStepData.id;
    setFilters((prev) => {
      const currentValues = prev[stepId] || [];
      let nextValues: string[];

      if (currentValues.includes(option)) {
        nextValues = currentValues.filter(v => v !== option);
      } else {
        nextValues = [...currentValues, option];
      }

      const newFilters = { ...prev, [stepId]: nextValues };
      if (nextValues.length === 0) {
        delete newFilters[stepId];
      }

      if (stepId === "subsetting" && nextValues.length > 0) {
        const currentBaseSettings = prev["base_setting"] || [];
        const requiredBaseSettings = new Set<string>(currentBaseSettings);
        
        nextValues.forEach(subValue => {
          const baseForSub = Object.keys(SETTING_RELATIONS).find(base => 
            SETTING_RELATIONS[base].some(sub => normalizeSetting(sub) === normalizeSetting(subValue))
          );
          if (baseForSub) {
            requiredBaseSettings.add(baseForSub);
          }
        });
        
        if (requiredBaseSettings.size > currentBaseSettings.length) {
          newFilters["base_setting"] = Array.from(requiredBaseSettings);
          setConflictMessage(null); 
        }
      }

      if (stepId === "base_setting") {
        const selectedBaseSettings = nextValues;
        const selectedSubsettings = prev["subsetting"] || [];

        if (selectedSubsettings.length > 0 && selectedBaseSettings.length > 0) {
          const validSubsettings = selectedSubsettings.filter(sub => 
            selectedBaseSettings.some(base => 
              SETTING_RELATIONS[base]?.some(s => normalizeSetting(s) === normalizeSetting(sub))
            )
          );

          if (validSubsettings.length !== selectedSubsettings.length) {
            if (validSubsettings.length === 0) {
              setConflictMessage("Конкретные сеттинги сброшены из-за конфликта с базовыми сеттингами");
              delete newFilters["subsetting"];
            } else {
              setConflictMessage("Некоторые конкретные сеттинги сброшены из-за конфликта");
              newFilters["subsetting"] = validSubsettings;
            }
          } else {
            setConflictMessage(null);
          }
        } else if (selectedBaseSettings.length > 0) {
          setConflictMessage(null);
        }
      }

      return newFilters;
    });
  };

  const handleNext = () => {
    if (currentStep < FILTER_STEPS.length - 1) {
      handleSetStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      handleSetStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < FILTER_STEPS.length - 1) {
      handleSetStep(currentStep + 1);
    }
  };

  const removeFilter = (stepId: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[stepId] || [];
      const nextValues = currentValues.filter((v) => v !== value);
      if (nextValues.length === 0) {
        return Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== stepId)
        );
      }
      return { ...prev, [stepId]: nextValues };
    });
  };

  const resetFilters = () => {
    setFilters({});
    handleSetStep(0);
  };

  const goToProgressGroup = useCallback(
    (groupIndex: number) => {
      const g = PROGRESS_GROUPS[groupIndex];
      const idxs = g.indices as readonly number[];
      const firstUnfilled = idxs.find((i) => !(filters[FILTER_STEPS[i].id]?.length));
      handleSetStep(firstUnfilled ?? idxs[0]);
    },
    [filters, FILTER_STEPS, PROGRESS_GROUPS, handleSetStep]
  );

  const groupIsCurrent = (g: (typeof PROGRESS_GROUPS)[number]) =>
    (g.indices as readonly number[]).includes(currentStep);

  const groupIsCompleted = (g: (typeof PROGRESS_GROUPS)[number]) => {
    const idxs = g.indices as readonly number[];
    const maxIdx = Math.max(...idxs);
    if (currentStep > maxIdx) return true;
    if (g.key === "setting") {
      return !!(filters.subsetting?.length || filters.base_setting?.length);
    }
    const fid = FILTER_STEPS[idxs[0]].id;
    return (filters[fid]?.length || 0) > 0;
  };

  const groupShowsReminderDot = (g: (typeof PROGRESS_GROUPS)[number]) => {
    const idxs = g.indices as readonly number[];
    return idxs.some((i) => !(filters[FILTER_STEPS[i].id]?.length));
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasSelectionInStep = (filters[currentStepData.id]?.length || 0) > 0;

  const collapsibleStep =
    currentStepData.id === "focus" || currentStepData.id === "world";

  const optionsFingerprint = currentStepData.options.join("\u0000");

  useLayoutEffect(() => {
    if (!collapsibleStep) {
      return;
    }
    const el = optionsGridRef.current;
    if (!el) return;

    const measure = () => {
      const prevMax = el.style.maxHeight;
      el.style.maxHeight = "none";
      const natural = el.scrollHeight;
      el.style.maxHeight = prevMax;
      setLongListOverflows(natural > COLLAPSED_OPTIONS_MAX_PX + 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsibleStep, optionsFingerprint]);

  return (
    <main className="relative min-h-screen text-yellow-100 font-serif selection:bg-yellow-500/30 p-4 sm:p-6 md:p-12">
      <AtmosphericBackground />

      <div className="max-w-7xl mx-auto mb-6 sm:mb-8 md:mb-10 pt-16 sm:pt-20 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 border-b border-yellow-500/35 pb-3 sm:pb-5 md:pb-6">
        <Link href="/" className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 transition-colors uppercase text-[10px] sm:text-xs tracking-widest font-bold order-2 sm:order-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.25)]">
          <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> Назад
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.36em] text-yellow-50 text-center order-1 sm:order-2 drop-shadow-[0_0_20px_rgba(253,224,71,0.45)]">
          Время приключений
        </h1>
        <div className="w-[100px] hidden md:block order-3"></div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500/70 group-focus-within:text-yellow-300 transition-colors" size={20} />
          <input
            type="text"
            placeholder="ПОИСК ПО НАЗВАНИЮ ИЛИ ТЕГАМ (ЖАНР, ВСЕЛЕННАЯ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-yellow-950/25 border-2 border-yellow-600/40 rounded-sm py-3 pl-12 pr-4 text-yellow-100 placeholder:text-yellow-700/60 focus:outline-none focus:border-yellow-400/70 focus:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all font-bold tracking-widest text-xs sm:text-sm uppercase"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-600 hover:text-yellow-300 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-center justify-center mb-3 sm:mb-4 px-2">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-yellow-400 font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center drop-shadow-[0_0_8px_rgba(250,204,21,0.35)]">
              Прогресс пути
            </span>
          </div>
          <div className="relative h-20 sm:h-24 md:h-28">
            <div className="absolute top-6 sm:top-7 md:top-8 left-0 right-0 h-px bg-yellow-600/30 z-0" />
            <div className="flex justify-between relative z-10 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-0 scrollbar-hide">
              {PROGRESS_GROUPS.map((group, groupIndex) => {
                const isCurrent = groupIsCurrent(group);
                const isCompleted = groupIsCompleted(group);

                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => goToProgressGroup(groupIndex)}
                    className="relative flex flex-col items-center gap-2 sm:gap-3 transition-all cursor-pointer opacity-100 hover:scale-105 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] rounded-md px-1"
                  >
                    <div
                      className={`relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? "bg-yellow-950/80 border-yellow-300 scale-110 shadow-[0_0_22px_rgba(253,224,71,0.65)]"
                          : isCompleted
                            ? "bg-yellow-950/50 border-yellow-500 shadow-[0_0_16px_rgba(234,179,8,0.4)]"
                            : "bg-transparent border-yellow-700/50 opacity-80"
                      }`}
                    >
                      <span
                        className={`${
                          isCurrent
                            ? "text-yellow-200 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]"
                            : isCompleted
                              ? "text-yellow-300"
                              : "text-yellow-600"
                        } flex items-center justify-center leading-none w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 [&>svg]:block [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[2.25px]`}
                      >
                        {group.icon}
                      </span>
                      {groupShowsReminderDot(group) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full border-2 border-yellow-950 z-10 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <span
                        className={`text-[11px] sm:text-[12px] md:text-[14px] leading-snug text-center max-w-[88px] sm:max-w-[120px] w-full uppercase tracking-[0.14em] font-bold transition-colors ${
                          isCurrent
                            ? "text-yellow-50 drop-shadow-[0_0_14px_rgba(253,224,71,0.85)]"
                            : isCompleted
                              ? "text-yellow-200"
                              : "text-yellow-400/90"
                        } group-hover:text-yellow-100`}
                      >
                        {group.barLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center items-center">
              <span className="text-[9px] sm:text-[10px] text-yellow-400 font-semibold uppercase tracking-wider drop-shadow-[0_0_6px_rgba(250,204,21,0.35)]">Активные фильтры:</span>
              <AnimatePresence mode="popLayout">
                {Object.entries(filters).map(([stepId, values]) => 
                  values.map((value) => (
                    <motion.button
                      key={`${stepId}-${value}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => removeFilter(stepId, value)}
                      className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-900/35 border border-yellow-500/50 text-yellow-100 hover:bg-yellow-800/45 hover:border-yellow-400 transition-all rounded-sm shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                    >
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">{value}</span>
                      <X size={10} className="sm:w-3 sm:h-3 opacity-70 group-hover:opacity-100" />
                    </motion.button>
                  ))
                )}
              </AnimatePresence>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-yellow-400 hover:text-yellow-200 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-colors"
                >
                  <RotateCcw size={10} className="sm:w-3 sm:h-3" />
                  Очистить все
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Сообщение о конфликте */}
        <AnimatePresence>
          {conflictMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="flex justify-center mb-8 overflow-hidden"
            >
              <div className="bg-yellow-400/95 text-yellow-950 px-4 sm:px-6 py-2 sm:py-3 rounded-sm flex items-center gap-3 font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] shadow-[0_0_28px_rgba(253,224,71,0.45)] border border-yellow-200">
                <AlertTriangle size={18} className="animate-pulse" />
                {conflictMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-yellow-50 drop-shadow-[0_0_18px_rgba(253,224,71,0.55)]">
            {currentStepData.heading}
          </h2>
        </div>

        <div className="w-full mb-8 sm:mb-10 md:mb-12 text-center">
          <div className="relative w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                ref={collapsibleStep ? optionsGridRef : undefined}
                style={
                  collapsibleStep && longListOverflows && !longListExpanded
                    ? { maxHeight: COLLAPSED_OPTIONS_MAX_PX, overflow: "hidden" }
                    : undefined
                }
                className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4"
              >
              {currentStepData.options.map((option) => {
                const isSelected = filters[currentStepData.id]?.includes(option);

                let isMismatched = false;

                if (currentStepData.id === "subsetting") {
                  const baseSettings = filters["base_setting"] || [];
                  isMismatched = !!(
                    baseSettings.length > 0 &&
                    !baseSettings.some((base) =>
                      SETTING_RELATIONS[base]?.some((sub) => normalizeSetting(sub) === normalizeSetting(option))
                    )
                  );
                } else if (currentStepData.id === "base_setting") {
                  const subsettings = filters["subsetting"] || [];
                  isMismatched = !!(
                    subsettings.length > 0 &&
                    !subsettings.some((sub) =>
                      SETTING_RELATIONS[option]?.some((s) => normalizeSetting(s) === normalizeSetting(sub))
                    )
                  );
                }

                let buttonClass =
                  "px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border-2 uppercase font-black transition-all duration-300 text-xs sm:text-sm tracking-widest rounded-sm ";

                if (isSelected) {
                  buttonClass +=
                    "bg-yellow-500 border-yellow-200 text-yellow-950 shadow-[0_0_24px_rgba(253,224,71,0.55)]";
                } else if (isMismatched) {
                  buttonClass +=
                    "border-yellow-900/20 bg-transparent text-yellow-900/40 hover:border-yellow-700/50 hover:text-yellow-600/70 hover:bg-yellow-950/20";
                } else {
                  buttonClass +=
                    "border-yellow-600/45 bg-transparent text-yellow-200 hover:border-yellow-400 hover:text-yellow-50 hover:bg-yellow-950/25 shadow-[0_0_10px_rgba(0,0,0,0.2)]";
                }

                return (
                  <button key={option} type="button" onClick={() => toggleOption(option)} className={buttonClass}>
                    {option}
                  </button>
                );
              })}
              </motion.div>
            </AnimatePresence>

            {collapsibleStep && longListOverflows && !longListExpanded && (
              <div
                className="pointer-events-none absolute left-0 right-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/85 to-transparent"
                aria-hidden
              />
            )}
          </div>

          {collapsibleStep && longListOverflows && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setLongListExpanded((v) => !v)}
                className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-yellow-300 hover:text-yellow-100 border-b border-yellow-500/50 hover:border-yellow-300 transition-colors pb-0.5 drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]"
              >
                {longListExpanded ? "Свернуть" : "Показать все"}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 min-h-[3rem]">
          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-yellow-950/35 border-2 border-yellow-600/50 text-yellow-200 font-black tracking-widest hover:bg-yellow-900/45 hover:border-yellow-400 hover:text-yellow-50 transition-all group text-sm sm:text-base shadow-[0_0_16px_rgba(234,179,8,0.12)]"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-2 transition-transform" />
              <span className="hidden sm:inline">НАЗАД</span>
            </motion.button>
          )}

          {currentStep < FILTER_STEPS.length - 1 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={hasSelectionInStep ? handleNext : handleSkip}
              className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 border-2 font-black tracking-widest transition-all group text-sm sm:text-base ${
                hasSelectionInStep
                  ? "bg-yellow-500/20 border-yellow-400 text-yellow-100 hover:bg-yellow-400 hover:text-yellow-950 hover:border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.25)]"
                  : "bg-yellow-950/25 border-yellow-700/45 text-yellow-300 hover:bg-yellow-900/35 hover:border-yellow-500 hover:text-yellow-100"
              }`}
            >
              {hasSelectionInStep ? (
                <>
                  ДАЛЕЕ <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                </>
              ) : (
                <>
                  ПРОПУСТИТЬ <SkipForward size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          )}

        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-10 md:mb-12 text-yellow-500/70">
          <div className="h-px flex-1 bg-current" />
          <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] font-bold px-2 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.35)]">
            Архивных свитков: {filteredAdventures.length}
          </span>
          <div className="h-px flex-1 bg-current" />
        </div>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          <AnimatePresence>
            {filteredAdventures.map((adv) => (
              <AdventureCard
                key={adv.id}
                as={motion.div}
                adventure={adv}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAdventure(adv)}
                imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AdventureModal adventure={selectedAdventure} isOpen={!!selectedAdventure} onClose={() => setSelectedAdventure(null)}
        onPrevious={() => {
          if (!selectedAdventure || filteredAdventures.length === 0) return;
          const idx = filteredAdventures.findIndex(a => a.id === selectedAdventure.id);
          const previousIndex = idx > 0 ? idx - 1 : filteredAdventures.length - 1;
          setSelectedAdventure(filteredAdventures[previousIndex]);
        }}
        onNext={() => {
          if (!selectedAdventure || filteredAdventures.length === 0) return;
          const idx = filteredAdventures.findIndex(a => a.id === selectedAdventure.id);
          const nextIndex = idx < filteredAdventures.length - 1 ? idx + 1 : 0;
          setSelectedAdventure(filteredAdventures[nextIndex]);
        }}
        hasPrevious={filteredAdventures.length > 1}
        hasNext={filteredAdventures.length > 1}
      />
    </main>
  );
}
