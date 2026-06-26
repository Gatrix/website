export type GameFormatId = "oneshot" | "adventure" | "campaign";

export type BookingGameSystem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  rulebook?: string | null;
};

export type BookingDifficulty = {
  id: string;
  name: string;
  description: string;
};

export type BookingUniverse = {
  id: string;
  name: string;
};

export type BookingBounds = {
  minPlayers: number;
  maxPlayers: number;
  minDurationHours: number;
  maxDurationHours: number;
};

export type FormatInfo = {
  id: GameFormatId;
  title: string;
  description: string;
};

export type WarningRule = {
  ruleId: number;
  warningId: number;
  adventureId: string | null;
  match: Record<string, unknown>;
};

export type BookingConfigPayload = {
  adventureId: string;
  adventureTitle: string;
  systems: BookingGameSystem[];
  difficulties: BookingDifficulty[];
  /** Единственная вселенная приключения (задаётся в БД, не выбирается в форме). */
  universe: BookingUniverse | null;
  bounds: BookingBounds;
  formats: FormatInfo[];
  warningRules: WarningRule[];
  warnings: { id: number; message: string }[];
  defaultAdventureType?: GameFormatId;
};

export type BookingSelectionState = {
  gameSystemId: string | null;
  difficultyId: string | null;
  universeId: string | null;
  playerCount: number;
  durationHours: number;
  adventureType: GameFormatId;
};
