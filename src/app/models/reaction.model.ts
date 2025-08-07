import {ReactionType} from "./enums";

export interface Reaction {
  id: string;
  userId: string;
  username: string;
  type: ReactionType;
  timestamp: Date;
  message?: string; // Message d'encouragement optionnel
}

