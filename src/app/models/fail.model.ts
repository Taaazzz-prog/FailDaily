import { FailCategory } from './enums';

export interface FailReactions {
  courageHearts: number;
  laughs: number;
  supports: number;
}

export interface FailAuthor {
  id: string;
  displayName: string;
  avatar: string;
}

export interface Fail {
  id: string;
  content: string;
  category: FailCategory;
  image?: string;
  author: FailAuthor;
  createdAt: Date;
  reactions: FailReactions;
  isAnonymous: boolean;
}
