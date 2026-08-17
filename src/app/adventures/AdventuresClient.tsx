"use client";

import React, { useState, useMemo, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import {
  RotateCcw,
  Shield,
  Target,
  X,
  Layers,
  Search,
  Gamepad2,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdventureModal from "@/components/AdventureModal";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import AdventureCard from "@/components/AdventureCard";
import GameBookingNotice from "@/components/GameBookingNotice";
import type { Adventure, AdventureOptions } from "@/lib/db";

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

const normalizeForSearch = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е");

type SearchableValue = string | string[] | null | undefined;

const collectSearchValues = (...values: SearchableValue[]): string[] =>
  values.flatMap((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((item): item is string => Boolean(item));
    return [value];
  });

/** Примерно три строки кнопок-фильтров (высота ряда + отступ между рядами). */
const COLLAPSED_OPTIONS_MAX_PX = 168;

/** Два ряда по четыре карточки на странице каталога. */
const PAGE_SIZE = 8;

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const prevPage = page - 1;
  const nextPage = page + 1;

  const textBtn =
    "min-h-[44px] px-3 sm:px-4 py-2 border-2 font-black transition-all duration-300 text-sm sm:text-base tracking-wide rounded-sm border-yellow-600/45 bg-transparent text-yellow-200 hover:border-yellow-400 hover:text-yellow-50 hover:bg-yellow-950/25 shadow-[0_0_10px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:pointer-events-none disabled:hover:border-yellow-600/45 disabled:hover:text-yellow-200 disabled:hover:bg-transparent";
  const numberBtn =
    "min-h-[52px] min-w-[52px] px-3 sm:px-4 py-1.5 border-2 font-black transition-all duration-300 text-[22px] sm:text-2xl leading-none rounded-sm border-yellow-600/45 bg-transparent text-yellow-200 hover:border-yellow-400 hover:text-yellow-50 hover:bg-yellow-950/25 shadow-[0_0_10px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:pointer-events-none disabled:hover:border-yellow-600/45 disabled:hover:text-yellow-200 disabled:hover:bg-transparent";
  const currentBtn =
    "inline-flex items-center justify-center min-h-[52px] min-w-[52px] px-3 sm:px-4 py-1.5 border-2 font-black text-[22px] sm:text-2xl leading-none rounded-sm bg-yellow-500 border-yellow-200 text-yellow-950 shadow-[0_0_24px_rgba(253,224,71,0.55)] cursor-default";

  return (
    <nav
      aria-label="Страницы приключений"
      className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2"
    >
      <button
        type="button"
        className={textBtn}
        disabled={page <= 1}
        onClick={() => onPageChange(1)}
      >
        Начало
      </button>
      {page > 1 ? (
        <button
          type="button"
          className={numberBtn}
          onClick={() => onPageChange(prevPage)}
          aria-label={`Страница ${prevPage}`}
        >
          {prevPage}
        </button>
      ) : (
        <span className={`${numberBtn} invisible pointer-events-none`} aria-hidden>
          0
        </span>
      )}
      <span aria-current="page" className={currentBtn}>
        {page}
        <span className="sr-only"> из {totalPages}</span>
      </span>
      {page < totalPages ? (
        <button
          type="button"
          className={numberBtn}
          onClick={() => onPageChange(nextPage)}
          aria-label={`Страница ${nextPage}`}
        >
          {nextPage}
        </button>
      ) : (
        <span className={`${numberBtn} invisible pointer-events-none`} aria-hidden>
          0
        </span>
      )}
      <button
        type="button"
        className={textBtn}
        disabled={page >= totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        Конец
      </button>
    </nav>
  );
}

/** Сеттинг, мир и формат — только одно значение; жанр — несколько. */
const SINGLE_SELECT_FILTER_IDS = new Set(["subsetting", "world", "adventure_type"]);

interface AdventuresClientProps {
  initialAdventures: Adventure[];
  adventureOptions?: AdventureOptions | null;
}

export default function AdventuresClient({ initialAdventures, adventureOptions }: AdventuresClientProps) {
  const opts = adventureOptions ?? DEFAULT_OPTIONS;
  const SETTING_RELATIONS = opts.setting_relations;
  const baseSettingLabels = useMemo(
    () => new Set<string>([...opts.base_setting, ...Object.keys(SETTING_RELATIONS)]),
    [opts.base_setting, SETTING_RELATIONS]
  );
  const rawSubsettings =
    opts.subsetting.length > 0 ? opts.subsetting : Object.values(SETTING_RELATIONS).flat();
  const SUB_SETTINGS_LIST = rawSubsettings.filter((s) => !baseSettingLabels.has(s));
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
      { id: "world" as const, icon: <Target size={36} />, options: WORLDS },
      { id: "subsetting" as const, icon: <Layers size={36} />, options: SUB_SETTINGS_LIST },
      { id: "focus" as const, icon: <Shield size={36} />, options: FOCUS_GENRES },
      { id: "adventure_type" as const, icon: <Gamepad2 size={36} />, options: ADVENTURE_TYPE_OPTIONS },
    ],
    [SUB_SETTINGS_LIST, FOCUS_GENRES, WORLDS, ADVENTURE_TYPE_OPTIONS]
  );

  const PROGRESS_GROUPS = useMemo(
    () =>
      [
        { key: "world" as const, barLabel: "Мир", indices: [0] as const, icon: <Target size={36} /> },
        { key: "setting" as const, barLabel: "Сеттинг", indices: [1] as const, icon: <Layers size={36} /> },
        { key: "genre" as const, barLabel: "Жанр", indices: [2] as const, icon: <Shield size={36} /> },
        { key: "type" as const, barLabel: "Формат", indices: [3] as const, icon: <Gamepad2 size={36} /> },
      ] as const,
    []
  );

  const stripBaseSettingFromFilters = useCallback(
    (raw: Record<string, string[]>): Record<string, string[]> => {
      const next: Record<string, string[]> = {};
      for (const [key, values] of Object.entries(raw)) {
        if (key === "base_setting") continue;
        const cleaned = values.filter((v) => !baseSettingLabels.has(v));
        if (cleaned.length > 0) next[key] = cleaned;
      }
      return next;
    },
    [baseSettingLabels]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const adventures = initialAdventures;
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [longListExpanded, setLongListExpanded] = useState(false);
  const [longListOverflows, setLongListOverflows] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const optionsGridRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  // Очистка сообщения о конфликте при смене шага
  const handleSetStep = useCallback((step: number) => {
    setLongListExpanded(false);
    const nextStepId = FILTER_STEPS[step]?.id;
    const nextIsCollapsible = nextStepId === "focus" || nextStepId === "world";
    if (!nextIsCollapsible) setLongListOverflows(false);
    setCurrentStep(step);
  }, [FILTER_STEPS]);

  // Функция для получения значения поля из приключения
  const getAdventureFieldValue = useCallback((adv: Adventure, fieldId: string): string | string[] | null => {
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
      return adv.gameformats ?? adv.adventure_type ?? null;
    }

    return adv[fieldId as keyof Adventure] as string | null;
  }, []);

  // Функция для проверки соответствия приключения фильтру
  const matchesFilter = useCallback((adv: Adventure, filterKey: string, selectedValues: string[]): boolean => {
    const value = getAdventureFieldValue(adv, filterKey);
    
    if (!value) return false;

    if (Array.isArray(value)) {
      return selectedValues.some(selected => value.includes(selected));
    }
    
    return selectedValues.includes(value);
  }, [getAdventureFieldValue]);

  // Функция для получения доступных опций из приключений с учетом текущих фильтров
  const getAvailableOptionsFromAdventures = useCallback((fieldId: string, currentFilters: Record<string, string[]>): string[] => {
    const filtered = adventures.filter((adv) => {
      return Object.entries(currentFilters).every(([key, selectedValues]) => {
        if (key === "base_setting") return true;
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
        if (key === "base_setting") return true;
        if (!selectedValues || selectedValues.length === 0) return true;
        return matchesFilter(adv, key, selectedValues);
      });

      if (!matchesButtons) return false;

      if (!searchQuery.trim()) return true;

      const query = normalizeForSearch(searchQuery.trim());
      const queryWords = query.split(/\s+/).filter(Boolean);
      
      const searchableFields = collectSearchValues(
        adv.title,
        adv.subsetting,
        adv.focus,
        adv.world,
        adv.adventure_type,
        adv.tags,
        adv.gameformats,
        adv.base_setting,
        adv.genre
      );

      const searchableText = searchableFields.map(field => normalizeForSearch(field)).join(" ");

      return queryWords.every(word => searchableText.includes(word));
    });
  }, [adventures, filters, searchQuery, matchesFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdventures.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAdventures = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAdventures.slice(start, start + PAGE_SIZE);
  }, [filteredAdventures, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery]);

  const goToPage = useCallback((nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [totalPages]);

  const toggleOption = (option: string) => {
    const stepId = currentStepData.id;
    setFilters((prev) => {
      const currentValues = prev[stepId] || [];
      let nextValues: string[];

      if (SINGLE_SELECT_FILTER_IDS.has(stepId)) {
        nextValues = currentValues.includes(option) ? [] : [option];
      } else if (currentValues.includes(option)) {
        nextValues = currentValues.filter((v) => v !== option);
      } else {
        nextValues = [...currentValues, option];
      }

      const newFilters = { ...prev, [stepId]: nextValues };
      if (nextValues.length === 0) {
        delete newFilters[stepId];
      }

      return stripBaseSettingFromFilters(newFilters);
    });
  };

  const removeFilter = (stepId: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[stepId] || [];
      const nextValues = currentValues.filter((v) => v !== value);
      const next =
        nextValues.length === 0
          ? Object.fromEntries(Object.entries(prev).filter(([key]) => key !== stepId))
          : { ...prev, [stepId]: nextValues };
      return stripBaseSettingFromFilters(next);
    });
  };

  const resetFilters = () => {
    setFilters({});
    handleSetStep(0);
  };

  const visibleFilters = useMemo(
    () => stripBaseSettingFromFilters(filters),
    [filters, stripBaseSettingFromFilters]
  );

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
      return !!filters.subsetting?.length;
    }
    const fid = FILTER_STEPS[idxs[0]].id;
    return (filters[fid]?.length || 0) > 0;
  };

  const groupShowsReminderDot = (g: (typeof PROGRESS_GROUPS)[number]) => {
    const idxs = g.indices as readonly number[];
    return idxs.some((i) => !(filters[FILTER_STEPS[i].id]?.length));
  };

  const hasActiveFilters = Object.keys(visibleFilters).length > 0;

  const activeFilterCount = useMemo(
    () => Object.values(visibleFilters).reduce((sum, values) => sum + values.length, 0),
    [visibleFilters]
  );

  const filterChipClass = (isSelected: boolean) =>
    isSelected
      ? "min-h-[44px] px-3 sm:px-4 py-2 border-2 uppercase font-black transition-all duration-300 text-[11px] sm:text-xs tracking-wider rounded-sm bg-yellow-500 border-yellow-200 text-yellow-950 shadow-[0_0_24px_rgba(253,224,71,0.55)]"
      : "min-h-[44px] px-3 sm:px-4 py-2 border-2 uppercase font-black transition-all duration-300 text-[11px] sm:text-xs tracking-wider rounded-sm border-yellow-600/45 bg-transparent text-yellow-200 hover:border-yellow-400 hover:text-yellow-50 hover:bg-yellow-950/25 shadow-[0_0_10px_rgba(0,0,0,0.2)]";

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

  useEffect(() => {
    if (!filtersSheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersSheetOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersSheetOpen]);

  const renderFilterOptions = () => (
    <>
      <div className="w-full mb-3 sm:mb-4 text-center">
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
              className="flex flex-wrap justify-center gap-1.5 sm:gap-2"
            >
              {currentStepData.options.map((option) => {
                const isSelected = filters[currentStepData.id]?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={filterChipClass(!!isSelected)}
                  >
                    {option}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {collapsibleStep && longListOverflows && !longListExpanded && (
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 sm:h-14 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/85 to-transparent"
              aria-hidden
            />
          )}
        </div>

        {collapsibleStep && longListOverflows && (
          <div className="mt-2 flex justify-center">
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
    </>
  );

  return (
    <main className="relative min-h-screen text-yellow-100 font-serif selection:bg-yellow-500/30 px-4 pb-4 sm:px-6 sm:pb-6 md:px-12 md:pb-8">
      <AtmosphericBackground />

      <div className="max-w-7xl mx-auto relative z-10 page-header-offset">
        <GameBookingNotice compact />
      </div>

      <div className="max-w-4xl mx-auto mb-5 sm:mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/70 group-focus-within:text-yellow-300 transition-colors" size={18} />
          <input
            type="text"
            placeholder="ПОИСК ПО НАЗВАНИЮ ИЛИ ТЕГАМ (ЖАНР, ВСЕЛЕННАЯ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-yellow-950/25 border-2 border-yellow-600/40 rounded-sm py-2 sm:py-2.5 pl-10 pr-4 text-yellow-100 placeholder:text-yellow-700/60 focus:outline-none focus:border-yellow-400/70 focus:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all font-bold tracking-widest text-[11px] sm:text-xs uppercase"
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

      <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
        {/* Mobile: compact filter trigger */}
        <div className="md:hidden mb-4">
          <button
            type="button"
            onClick={() => setFiltersSheetOpen(true)}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 border-2 border-yellow-600/50 bg-yellow-950/30 text-yellow-100 font-black uppercase tracking-widest text-xs rounded-sm"
          >
            <SlidersHorizontal size={18} aria-hidden />
            Фильтры{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        {/* Desktop filter panel */}
        <div className="hidden md:block">
        <div className="mb-2.5 sm:mb-3">
          <div className="relative overflow-visible">
            <div className="absolute top-6 sm:top-[30px] md:top-[33px] left-0 right-0 h-px bg-yellow-600/30 z-0 pointer-events-none" />
            <div className="relative z-10 overflow-x-auto sm:overflow-x-visible overflow-y-visible scrollbar-hide">
              <div className="flex justify-between min-w-max sm:min-w-0 gap-3 sm:gap-0 px-1 sm:px-0">
              {PROGRESS_GROUPS.map((group, groupIndex) => {
                const isCurrent = groupIsCurrent(group);
                const isCompleted = groupIsCompleted(group);

                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => goToProgressGroup(groupIndex)}
                    className="relative flex flex-col items-center gap-0.5 sm:gap-1 transition-all cursor-pointer opacity-100 hover:scale-105 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] rounded-md px-1 shrink-0"
                  >
                    <div
                      className={`relative w-12 h-12 sm:w-[60px] sm:h-[60px] md:w-[66px] md:h-[66px] rounded-full flex items-center justify-center border-2 transition-all overflow-visible ${
                        isCurrent
                          ? "bg-yellow-950/80 border-yellow-300 sm:scale-110 shadow-[0_0_22px_rgba(253,224,71,0.65)]"
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
                        } flex items-center justify-center leading-none w-6 h-6 sm:w-[30px] sm:h-[30px] md:w-9 md:h-9 [&>svg]:block [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:stroke-[2.25px]`}
                      >
                        {group.icon}
                      </span>
                      {groupShowsReminderDot(group) && (
                        <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-[18px] h-[18px] sm:w-[21px] sm:h-[21px] bg-yellow-500 rounded-full border-2 border-yellow-950 z-10 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <span
                        className={`text-[15px] sm:text-[17px] md:text-lg leading-snug text-center max-w-[120px] sm:max-w-[162px] w-full uppercase tracking-[0.12em] font-bold transition-colors ${
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
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 sm:mb-4"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center items-center">
              <span className="text-[9px] sm:text-[10px] text-yellow-400 font-semibold uppercase tracking-wider drop-shadow-[0_0_6px_rgba(250,204,21,0.35)]">Активные фильтры:</span>
              <AnimatePresence mode="popLayout">
                {Object.entries(visibleFilters).map(([stepId, values]) => 
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

        <div className="mb-4 sm:mb-5 text-center">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-[0.35em] text-yellow-100 drop-shadow-[0_0_14px_rgba(253,224,71,0.45)]">
            Фильтр
          </h2>
          <p className="mt-2 text-sm sm:text-base text-yellow-300/85 leading-relaxed w-full max-w-4xl mx-auto px-1">
            <span className="block sm:whitespace-nowrap">
              Выберите приключение по любимой вселенной, сеттингу или жанру!
            </span>
          </p>
        </div>

        {renderFilterOptions()}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {filtersSheetOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Закрыть фильтры"
            onClick={() => setFiltersSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Фильтры приключений"
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] flex flex-col rounded-t-xl border-t border-yellow-700/40 bg-[#0c0a09] shadow-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-900/30 shrink-0">
              <h2 className="text-sm font-black uppercase tracking-widest text-yellow-100">
                Фильтры{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setFiltersSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-yellow-400"
                aria-label="Закрыть"
              >
                <X size={22} />
              </button>
            </div>

            <div className="overflow-x-auto shrink-0 border-b border-yellow-900/25 px-2 py-2">
              <div className="flex gap-1 min-w-max">
                {PROGRESS_GROUPS.map((group, groupIndex) => {
                  const isCurrent = groupIsCurrent(group);
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => goToProgressGroup(groupIndex)}
                      className={`min-h-[44px] px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm border-2 transition-colors ${
                        isCurrent
                          ? "border-yellow-300 bg-yellow-500 text-yellow-950"
                          : "border-yellow-700/45 text-yellow-200 bg-transparent"
                      }`}
                    >
                      {group.barLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {hasActiveFilters ? (
                <div className="mb-4 flex flex-wrap gap-2 justify-center">
                  {Object.entries(visibleFilters).map(([stepId, values]) =>
                    values.map((value) => (
                      <button
                        key={`${stepId}-${value}`}
                        type="button"
                        onClick={() => removeFilter(stepId, value)}
                        className="min-h-[44px] flex items-center gap-2 px-3 py-2 bg-yellow-900/35 border border-yellow-500/50 text-yellow-100 rounded-sm text-[10px] font-bold uppercase"
                      >
                        {value}
                        <X size={12} />
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="min-h-[44px] flex items-center gap-1 px-3 text-yellow-400 text-[10px] font-bold uppercase"
                  >
                    <RotateCcw size={12} />
                    Очистить
                  </button>
                </div>
              ) : null}
              {renderFilterOptions()}
            </div>

            <div className="shrink-0 px-4 py-3 border-t border-yellow-900/30">
              <button
                type="button"
                onClick={() => setFiltersSheetOpen(false)}
                className="w-full min-h-[44px] bg-yellow-500 text-yellow-950 font-black uppercase tracking-widest text-sm rounded-sm"
              >
                Показать {filteredAdventures.length} сюжетов
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={catalogRef} className="max-w-7xl mx-auto scroll-mt-24">
        {adventures.length === 0 ? (
          <p className="text-body text-center text-sm sm:text-base py-12 px-4 border border-amber-900/35 rounded-lg bg-amber-950/20">
            Каталог приключений сейчас недоступен — не удалось загрузить данные из базы. Проверьте, что на
            сервере задана переменная <span className="font-mono text-amber-300/90">DATABASE_URL</span>, и
            перезапустите приложение.
          </p>
        ) : null}

        {totalPages > 1 ? (
          <div className="mb-4 sm:mb-5">
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        ) : null}

        <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          <AnimatePresence>
            {pagedAdventures.map((adv) => (
              <AdventureCard
                key={adv.id}
                as={motion.div}
                adventure={adv}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAdventure(adv)}
                imageSizes="(max-width: 768px) 50vw, 25vw"
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {totalPages > 1 ? (
          <div className="mt-4 sm:mt-5">
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        ) : null}
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
