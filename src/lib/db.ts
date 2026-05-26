export interface Adventure {
  id: string;
  title: string;
  poster?: string;
  img_url?: string;
  /** Предвычисленный URL изображения (подписанный или локальный) */
  imageUrl?: string | null;
  /** Описание для игроков на карточке приключения */
  intro?: string;
  /** Краткое описание сюжета от и до для ведущего */
  description?: string;
  /** Жанры приключения (может быть несколько) */
  genre?: string[];
  logline?: string;
  tone?: string | string[];
  format?: string;
  durationHours?: string;
  durationMinutes?: number;
  isBeginnerFriendly?: boolean;
  contentWarnings?: string[];
  highlights?: string[];
  benefits?: string[];
  ageRating?: string;
  price?: string;
  priceLabel?: string;
  hasUpcomingSlots7d?: boolean;
  playerCount?: { min: number; max: number };
  tags?: string;
  universe?: string;
  base_setting?: string;
  subsetting?: string;
  world?: string | string[];
  focus?: string | string[];
  /** Сложность: 💀 (1), 💀💀 (2), 💀💀💀 (3) */
  difficulty?: string;
  /** Тип приключения: Ваншот (1 сессия), Приключение (до 10), Кампания (10+) */
  adventure_type?: string;
  /** Допустимые форматы (из gameformat), для фильтров */
  gameformats?: string[];
  /** Время одной игры (например "5-6 часов") */
  session_duration?: string;
  /** Количество игроков (например "4-6 игроков") */
  player_count?: string;
  /** Тема/сеттинг для полоски на постере карточки */
  theme?: string;
  /** @deprecated Используйте player_count */
  players?: string;
  /** @deprecated Используйте session_duration */
  time?: string;
  created_at?: string;
}

/** Справочник фильтров на странице приключений (PostgreSQL / Object Storage JSON). */
export interface AdventureOptions {
  base_setting: string[];
  setting_relations: Record<string, string[]>;
  subsetting: string[];
  genre: string[];
  universe: string[];
  session_duration?: string[];
  player_count?: string[];
  /** Опционально из JSON: типы сюжета (oneshot → «Ваншот» и т.д.) */
  adventure_type?: { id: string; label: string; sessions?: string }[];
}

export interface Profile {
  id: string;
  user_id: string;
  player_name: string | null;
  avatar_url: string | null;
  games_count: number;
  level: number;
  created_at?: string;
}
