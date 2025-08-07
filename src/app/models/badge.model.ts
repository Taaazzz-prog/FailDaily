import {BadgeCategory} from "./enums";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  unlockedDate?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

