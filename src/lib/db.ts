// Types for the database tables
export interface Adventure {
  id: string;
  title: string;
  poster?: string;
  img_url?: string;
  description?: string;
  genre?: string | string[];
  logline?: string;
  tone?: string | string[];
  difficulty?: string;
  format?: string;
  durationhours?: string;
  durationminutes?: number;
  isbeginnerfriendly?: boolean;
  contentwarnings?: string[];
  highlights?: string[];
  benefits?: string[];
  agerating?: string;
  price?: string;
  pricelabel?: string;
  hasupcomingslots7d?: boolean;
  playercount?: { min: number; max: number };
  tags?: string;
  universe?: string;
  base_setting?: string;
  subsetting?: string;
  world?: string;
  focus?: string;
  players?: string;
  time?: string;
  created_at?: string;
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
