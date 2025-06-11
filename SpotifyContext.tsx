import { createContext, useContext, useState, ReactNode } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl: string | null;
  uri: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SpotifyContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Song[];
  searchError: string | null;
  isSearchLoading: boolean;
  playTrack: (track: Song) => Promise<void>;
  playTrackId: string | null;
  isPlaying: boolean;
  currentTrack: Song | null;
  spotifyPlayTrackId: string | null;
  spotifyLoading: boolean;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [playTrackId, setPlayTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [spotifyPlayTrackId, setSpotifyPlayTrackId] = useState<string | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  const playTrack = async (track: Song) => {
    try {
      setCurrentTrack(track);
      setPlayTrackId(track.id);
      setIsPlaying(true);
      // Implement actual Spotify playback logic here
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  return (
    <SpotifyContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchResults,
        searchError,
        isSearchLoading,
        playTrack,
        playTrackId,
        isPlaying,
        currentTrack,
        spotifyPlayTrackId,
        spotifyLoading
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
} 