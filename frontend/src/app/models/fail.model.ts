import { FailCategory } from './enums';

export interface FailReactions {
  courage: number;
  empathy: number;
  laugh: number;
  support: number;
}

export interface FailAuthor {
  id: string;
  displayName: string;
  avatar: string;
}

export interface Fail {
  id: string;
  title: string;
  description: string;
  category: FailCategory;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  reactions: FailReactions;
  commentsCount: number;
  isPublic: boolean;
  createdAt: Date;
  encouragementMessage?: string;
}
