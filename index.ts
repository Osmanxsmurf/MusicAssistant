import { Song } from '../../../shared/schema';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    favoriteGenres?: string[];
    favoriteMoods?: string[];
    favoriteArtists?: string[];
  };
}

export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
  genres?: string[];
  similarArtists?: string[];
  topTracks?: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songs: Song[];
  createdBy: number; // User ID
  createdAt: number;
  isPublic: boolean;
}

export interface MusicPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
}

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  playlists: Playlist[];
}
