import { ReactionType } from "./enums";

export interface Reaction {
  id: string;
  userId: string;
  displayName: string;
  type: ReactionType;
  timestamp: Date;
  message?: string; // Message d'encouragement optionnel
}

