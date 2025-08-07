export interface FailNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  relatedFailId?: string;
  relatedUserId?: string;
}

export enum NotificationType {
  DAILY_REMINDER = 'daily_reminder',
  REACTION_RECEIVED = 'reaction_received',
  BADGE_UNLOCKED = 'badge_unlocked',
  MILESTONE_REACHED = 'milestone_reached',
  COMMUNITY_SUPPORT = 'community_support'
}

