export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; height: number; width: number }[];
}

export interface LastFmTrack {
  name: string;
  artist: {
    name: string;
  };
  playcount: string;
  listeners: string;
  image: { '#text': string; size: string }[];
  url: string;
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export interface ChatMessage {
  id: number;
  message: string;
  response?: string;
  isAI: boolean;
  timestamp: Date;
  intent?: string;
  mood?: string;
}

export interface MoodType {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface MusicCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  volume: number;
  progress: number;
  duration: number;
  queue: SpotifyTrack[];
  shuffle: boolean;
  repeat: 'off' | 'track' | 'context';
}
