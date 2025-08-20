// Models pour le système de suivi d'utilisateurs

export interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: Date;
}

export interface UserProfile {
    id: string;
    display_name: string;
    avatar_url: string;
    bio?: string;
    totalFails: number;
    couragePoints: number;
    followersCount: number;
    followingCount: number;
    isFollowing?: boolean;
    joinedAt: Date;
}

export interface FollowStats {
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
}
