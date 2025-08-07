import { Badge } from './badge.model';
import { UserPreferences } from './user-preferences.model';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  joinDate: Date;
  totalFails: number;
  couragePoints: number;
  badges: Badge[];
  preferences?: UserPreferences;
}
