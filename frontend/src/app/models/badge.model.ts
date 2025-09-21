import { BadgeCategory } from "./enums";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  unlockedDate?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Nouveaux champs pour le système de requirements basé sur ta BDD
  requirementType?: string;
  requirementValue?: string;
  // Structure provenant de l'API backend
  requirements?: {
    type: string;
    value: number;
  };
}

