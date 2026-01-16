"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  RotateCcw,
  Shield,
  Target,
  Globe,
  Palette,
  ArrowRight,
  ArrowLeft,
  X,
  SkipForward,
  Layers,
  BookOpen,
  AlertTriangle,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdventureModal from "@/components/AdventureModal";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import AdventureCard from "@/components/AdventureCard";
import { useAdventures, type Adventure } from "@/hooks/useAdventures";
import { getIconBySetting } from "@/lib/utils";

// Базовые сеттинги
const BASE_SETTINGS = [
  "Реализм",
  "Фентези",
  "Фантастика",
  "Реализм + Фентези",
  "Реализм + Фантастика",
  "Фентези + Фантастика",
  "Реализм + Фентези + Фантастика"
];

// Связи базовых и конкретных сеттингов
const SETTING_RELATIONS: Record<string, string[]> = {
  "Реализм": ["История", "Современность", "Будущее"],
  "Фентези": ["Эпическое фентези", "Темное фентези", "Сказочное фентези"],
  "Фантастика": ["Твердая НФ", "Мягкая НФ", "Космическая НФ"],
  "Реализм + Фентези": ["Городское фентези", "Фольклор", "Историческое фентези"],
  "Реализм + Фантастика": ["Стимпанк", "Ретрофутуризм", "Киберпанк"],
  "Фентези + Фантастика": ["Техномагия", "Научная фантазия", "Космоопера"],
  "Реализм + Фентези + Фантастика": ["Постапокалипсис", "Супергероика", "Странность"]
};

// Функция для нормализации строк при сравнении (ё/е, э/е)
const normalizeSetting = (s: string) => 
  s.toLowerCase()
   .replace(/ё/g, 'е')
   .replace(/э/g, 'е')
   .replace(/[^a-zа-я0-9]/g, '');

const normalizeForSearch = (s: string) => 
  s.toLowerCase()
   .replace(/ё/g, 'е');

// Конкретные сеттинги (собираем из всех категорий)
const SUB_SETTINGS_LIST = Object.values(SETTING_RELATIONS).flat();

// Тональность (тагглы)
const TONE_TAGS = {
  "Светлая/Мрачная": ["Светлая атмосфера", "Мрачная атмосфера"],
  "Серьезная/Комедийная": ["Серьезная атмосфера", "Комедийная атмосфера"],
  "Реалистичная/Сказочная": ["Реалистичная атмосфера", "Сказочная атмосфера"],
  "Жестокая/Щадящая": ["Жестокая атмосфера", "Щадящая атмосфера"],
};

// Фокус игры (Жанр)
const FOCUS_GENRES = [
  "Приключение", "Экшен", "Военный", "Выживание", "Детектив", 
  "Хоррор", "Мистика", "Драма", "Комедия", "Криминал", 
  "Политический", "Шпионский", "Гротеск", "Катастрофа", "Путешествие"
];

// Конкретные игровые вселенные
const WORLDS = [
  "Вестерос", "Средиземье", "DnD Миры", "Тамриэль", "Город парового солнца"
];

const FILTER_STEPS = [
  {
    id: "base_setting",
    label: "Базовый сеттинг",
    description: "Базовый сеттинг",
    icon: <Globe size={24} />,
    options: BASE_SETTINGS,
  },
  {
    id: "subsetting",
    label: "Конкретный сеттинг",
    description: "Конкретный сеттинг",
    icon: <Layers size={24} />,
    options: SUB_SETTINGS_LIST,
  },
  {
    id: "tone",
    label: "Тональность",
    description: "Атмосфера",
    icon: <Palette size={24} />,
    options: [] as string[], // Динамически - тагглы
  },
  {
    id: "focus",
    label: "Фокус игры",
    description: "Жанр",
    icon: <Shield size={24} />,
    options: FOCUS_GENRES,
  },
  {
    id: "world",
    label: "Выбери вселенную",
    description: "Игровая вселенная",
    icon: <Target size={24} />,
    options: WORLDS,
  },
];

export default function AdventuresPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const { adventures, loading } = useAdventures();
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);

  // Очистка сообщения о конфликте при смене шага
  const handleSetStep = (step: number) => {
    setConflictMessage(null);
    setCurrentStep(step);
  };

  // Функция для получения значения поля из приключения
  const getAdventureFieldValue = (adv: Adventure, fieldId: string): string | string[] | null => {
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
    
    if (fieldId === "tone") {
      const tone = adv.tone;
      if (!tone) return null;
      if (typeof tone === 'string') {
        return tone.split(/[,;|]/).map(t => t.trim()).filter(t => t);
      }
      if (Array.isArray(tone)) return tone;
      return [tone];
    }
    
    if (fieldId === "focus") {
      return adv.focus || null;
    }
    
    if (fieldId === "world") {
      return adv.world || null;
    }
    
    return adv[fieldId as keyof Adventure] as string | null;
  };

  // Функция для проверки соответствия приключения фильтру
  const matchesFilter = (adv: Adventure, filterKey: string, selectedValues: string[]): boolean => {
    const value = getAdventureFieldValue(adv, filterKey);
    
    if (!value) return false;
    
    if (filterKey === "base_setting") {
      const advBases = Array.isArray(value) ? value : [value];
      return selectedValues.some(selected => advBases.includes(selected));
    }
    
    if (filterKey === "tone") {
      const advTones = (Array.isArray(value) ? value : [value]).map(t => t.toLowerCase());
      return selectedValues.some(selected => {
        const normalizedSelected = selected.toLowerCase();
        const base = normalizedSelected.replace(" атмосфера", "");
        return advTones.includes(normalizedSelected) || advTones.includes(base);
      });
    }
    
    if (Array.isArray(value)) {
      return selectedValues.some(selected => value.includes(selected));
    }
    
    return selectedValues.includes(value);
  };

  // Функция для получения доступных опций из приключений с учетом текущих фильтров
  const getAvailableOptionsFromAdventures = (fieldId: string, currentFilters: Record<string, string[]>): string[] => {
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
  };

  // Получаем доступные опции для текущего шага с учетом выбранных фильтров
  const currentStepData = useMemo(() => {
    const step = FILTER_STEPS[currentStep];
    
    // Получаем доступные опции из всех приключений
    const availableFromAdventures = getAvailableOptionsFromAdventures(step.id, filters);

    if (step.id === "tone") {
      const allToneTags = Object.values(TONE_TAGS).flat();
      const filteredTags = availableFromAdventures.length > 0 
        ? allToneTags.filter(t => {
            const normalizedT = t.toLowerCase();
            const base = normalizedT.replace(" атмосфера", "");
            return availableFromAdventures.some(advT => {
              const normalizedAdvT = advT.toLowerCase();
              return normalizedAdvT === normalizedT || normalizedAdvT === base;
            });
          })
        : []; // Показываем только если есть в приключениях
      return { ...step, options: filteredTags };
    }
    
    // Для всех остальных шагов показываем только то, что есть в приключениях
    return { ...step, options: availableFromAdventures };
  }, [currentStep, filters, adventures]);

  const filteredAdventures = useMemo(() => {
    return adventures.filter((adv) => {
      // Фильтрация по кнопкам (тегам)
      const matchesButtons = Object.entries(filters).every(([key, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        return matchesFilter(adv, key, selectedValues);
      });

      if (!matchesButtons) return false;

      // Фильтрация по поисковой строке
      if (!searchQuery.trim()) return true;

      const query = normalizeForSearch(searchQuery.trim());
      const queryWords = query.split(/\s+/).filter(Boolean);
      
      const searchableFields = [
        adv.title,
        adv.subsetting,
        adv.focus,
        adv.world,
        ...(Array.isArray(adv.base_setting) ? adv.base_setting : [adv.base_setting]),
        ...(Array.isArray(adv.tone) ? adv.tone : [adv.tone])
      ].filter(Boolean) as string[];

      const searchableText = searchableFields.map(field => normalizeForSearch(field)).join(" ");

      return queryWords.every(word => searchableText.includes(word));
    });
  }, [adventures, filters, searchQuery]);

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

      // Автоматический выбор базового сеттинга при выборе конкретного
      if (stepId === "subsetting" && nextValues.length > 0) {
        // Собираем базовые сеттинги для всех выбранных подсеттингов
        const currentBaseSettings = prev["base_setting"] || [];
        const requiredBaseSettings = new Set<string>(currentBaseSettings);
        
        // Добавляем базу только для последнего выбранного подсеттинга, если его база еще не выбрана
        // или для всех, если мы хотим быть строгими. Здесь лучше добавить для всех выбранных.
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

      // Логика конфликта для базового сеттинга
      if (stepId === "base_setting") {
        const selectedBaseSettings = nextValues;
        const selectedSubsettings = prev["subsetting"] || [];

        if (selectedSubsettings.length > 0 && selectedBaseSettings.length > 0) {
          // Оставляем только те подсеттинги, которые подходят хотя бы к одному из выбранных базовых
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
        const { [stepId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [stepId]: nextValues };
    });
  };

  const clearFilterStep = (stepId: string) => {
    setFilters((prev) => {
      const { [stepId]: _, ...rest } = prev;
      return rest;
    });
  };

  const resetFilters = () => {
    setFilters({});
    handleSetStep(0);
  };

  const getFilterLabel = (stepId: string): string => {
    const step = FILTER_STEPS.find(s => s.id === stepId);
    return step?.label || stepId;
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasSelectionInStep = (filters[currentStepData.id]?.length || 0) > 0;

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 p-4 sm:p-6 md:p-12">
      <AtmosphericBackground />

      <div className="max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12 pt-20 sm:pt-24 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 border-b border-amber-900/30 pb-4 sm:pb-6 md:pb-7">
        <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-500 transition-colors uppercase text-[10px] sm:text-xs tracking-widest font-bold order-2 sm:order-1">
          <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> Назад
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.36em] text-amber-100 text-center order-1 sm:order-2">
          Архив Приключений
        </h1>
        <div className="w-[100px] hidden md:block order-3"></div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900/50 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="ПОИСК ПО НАЗВАНИЮ ИЛИ ТЕГАМ (ЖАНР, ВСЕЛЕННАЯ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-amber-950/20 border-2 border-amber-900/30 rounded-sm py-3 pl-12 pr-4 text-amber-100 placeholder:text-amber-900/40 focus:outline-none focus:border-amber-700/50 transition-all font-bold tracking-widest text-xs sm:text-sm uppercase"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-900/50 hover:text-amber-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-center justify-center mb-3 sm:mb-4 px-2">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-amber-600 font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] opacity-70 text-center">
              Прогресс пути
            </span>
          </div>
          <div className="relative h-20 sm:h-24 md:h-28">
            <div className="absolute top-6 sm:top-7 md:top-8 left-0 right-0 h-[1px] bg-amber-900/20 z-0"></div>
            <div className="flex justify-between relative z-10 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-0 scrollbar-hide">
              {FILTER_STEPS.map((step, index) => {
                const handleStepClick = () => {
                  handleSetStep(index);
                };
                const isCompleted = index < currentStep || (filters[step.id]?.length || 0) > 0;
                const isCurrent = index === currentStep;
                const isUpcoming = !isCompleted && !isCurrent;

                return (
                  <button
                    key={step.id}
                    onClick={handleStepClick}
                    data-state={isCompleted ? "completed" : isCurrent ? "current" : "upcoming"}
                    className="relative flex flex-col items-center gap-2 sm:gap-3 transition-all cursor-pointer opacity-100 hover:scale-105 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] rounded-md px-1"
                    title={`${step.label} - ${step.description}`}
                  >
                    <div
                      className={`relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? "bg-amber-900 border-amber-400 scale-110 shadow-[0_0_18px_rgba(245,158,11,0.5)]"
                          : isCompleted
                            ? "bg-amber-950 border-amber-500 shadow-[0_0_14px_rgba(200,120,45,0.35)]"
                            : "bg-transparent border-amber-900/60 opacity-60"
                      }`}
                    >
                      <span
                        className={`${
                          isCurrent
                            ? "text-amber-300"
                            : isCompleted
                              ? "text-amber-400"
                              : "text-amber-800/70"
                        } w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6`}
                      >
                        {step.icon}
                      </span>
                      {(!filters[step.id] || filters[step.id].length === 0) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-amber-600 rounded-full border-2 border-amber-950 z-10"></span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <span
                        className={`text-[11px] sm:text-[12px] md:text-[14px] leading-snug text-center max-w-[80px] sm:max-w-[110px] w-full uppercase tracking-[0.12em] font-semibold transition-colors ${
                          isCurrent
                            ? "text-amber-200"
                            : isCompleted
                              ? "text-amber-200/80"
                              : "text-amber-600/60"
                        } group-hover:text-amber-200`}
                      >
                        {step.description}
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
              <span className="text-[9px] sm:text-[10px] text-amber-600/70 font-semibold uppercase tracking-wider">Активные фильтры:</span>
              <AnimatePresence mode="popLayout">
                {Object.entries(filters).map(([stepId, values]) => 
                  values.map((value) => (
                    <motion.button
                      key={`${stepId}-${value}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => removeFilter(stepId, value)}
                      className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-900/40 border border-amber-700/50 text-amber-300 hover:bg-amber-800/50 hover:border-amber-600 transition-all rounded-sm"
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
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-amber-600/70 hover:text-amber-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-colors"
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
              <div className="bg-amber-500/90 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-sm flex items-center gap-3 font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-amber-400">
                <AlertTriangle size={18} className="animate-pulse" />
                {conflictMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-amber-200">
            {currentStepData.label}
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-10 md:mb-12 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {currentStepData.id === "tone" ? (
                // Для тональности показываем тагглы (пары опций), только если они есть в приключениях
                Object.entries(TONE_TAGS).map(([tagGroup, tagOptions]) => {
                  const availableOptions = tagOptions.filter(opt => currentStepData.options.includes(opt));
                  if (availableOptions.length === 0) return null;
                  
                  return (
                    <div key={tagGroup} className="flex gap-2 mb-2 sm:mb-0">
                      {availableOptions.map((option) => {
                        const isSelected = filters[currentStepData.id]?.includes(option);
                        
                        let buttonClass = "px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border-2 uppercase font-black transition-all duration-300 text-xs sm:text-sm tracking-widest rounded-sm ";
                        
                        if (isSelected) {
                          buttonClass += "bg-amber-700 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]";
                        } else {
                          buttonClass += "border-amber-900/40 bg-transparent text-amber-900 hover:border-amber-700 hover:text-amber-600";
                        }

                        return (
                          <button
                            key={option}
                            onClick={() => toggleOption(option)}
                            className={buttonClass}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                // Для остальных фильтров показываем обычный список
                currentStepData.options.map((option) => {
                  const isSelected = filters[currentStepData.id]?.includes(option);
                  
                  let isMismatched = false;
                  
                  if (currentStepData.id === "subsetting") {
                    const baseSettings = filters["base_setting"] || [];
                    isMismatched = !!(baseSettings.length > 0 && !baseSettings.some(base => 
                      SETTING_RELATIONS[base]?.some(sub => normalizeSetting(sub) === normalizeSetting(option))
                    ));
                  } else if (currentStepData.id === "base_setting") {
                    const subsettings = filters["subsetting"] || [];
                    isMismatched = !!(subsettings.length > 0 && !subsettings.some(sub => 
                      SETTING_RELATIONS[option]?.some(s => normalizeSetting(s) === normalizeSetting(sub))
                    ));
                  }

                  let buttonClass = "px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border-2 uppercase font-black transition-all duration-300 text-xs sm:text-sm tracking-widest rounded-sm ";
                  
                  if (isSelected) {
                    buttonClass += "bg-amber-700 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]";
                  } else if (isMismatched) {
                    buttonClass += "border-amber-900/10 bg-transparent text-amber-900/30 hover:border-amber-700/50 hover:text-amber-600/50 hover:bg-amber-900/5";
                  } else {
                    buttonClass += "border-amber-900/40 bg-transparent text-amber-900 hover:border-amber-700 hover:text-amber-600";
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => toggleOption(option)}
                      className={buttonClass}
                    >
                      {option}
                    </button>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 min-h-[3rem]">
          {/* Кнопка "Назад" */}
          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-amber-950/30 border-2 border-amber-800/50 text-amber-600 font-black tracking-widest hover:bg-amber-900/40 hover:border-amber-700 hover:text-amber-500 transition-all group text-sm sm:text-base"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-2 transition-transform" />
              <span className="hidden sm:inline">НАЗАД</span>
            </motion.button>
          )}

          {/* Кнопка "Пропустить/Далее" */}
          {currentStep < FILTER_STEPS.length - 1 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={hasSelectionInStep ? handleNext : handleSkip}
              className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 border-2 font-black tracking-widest transition-all group text-sm sm:text-base ${
                hasSelectionInStep
                  ? "bg-amber-900/20 border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-black"
                  : "bg-amber-950/20 border-amber-900/40 text-amber-700/70 hover:bg-amber-900/30 hover:border-amber-800/60 hover:text-amber-600"
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
        <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-10 md:mb-12 text-amber-900/50">
          <div className="h-[1px] flex-1 bg-current" />
          <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] font-bold px-2">Архивных свитков: {filteredAdventures.length}</span>
          <div className="h-[1px] flex-1 bg-current" />
        </div>

        {loading ? (
          <div className="text-center text-amber-900/50 py-16 sm:py-20 md:py-24 text-base sm:text-lg md:text-xl font-bold italic animate-pulse tracking-widest">Чтение древних хроник...</div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
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
        )}
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