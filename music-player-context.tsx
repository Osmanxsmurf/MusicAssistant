import React, { createContext, useContext, ReactNode } from 'react';
import { Song } from '@shared/schema';

// Müzik Oynatıcı Bağlamı
export interface MusicPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
}

// Varsayılan değerler
const defaultContext: MusicPlayerContextType = {
  currentSong: null,
  isPlaying: false,
  playSong: () => {},
  pauseSong: () => {},
  resumeSong: () => {},
  nextSong: () => {},
  previousSong: () => {}
};

// Context oluşturma
export const MusicPlayerContext = createContext<MusicPlayerContextType>(defaultContext);

// Context hook
export const useMusicPlayer = () => useContext(MusicPlayerContext);

// Provider bileşeni
interface MusicPlayerProviderProps {
  children: ReactNode;
}

export const MusicPlayerProvider = ({ children }: MusicPlayerProviderProps) => {
  const [currentSong, setCurrentSong] = React.useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const queue: Song[] = []; // setQueue removed, queue will always be empty
  const [queueIndex, setQueueIndex] = React.useState(0);
  
  // Müzik oynatıcı fonksiyonları
  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    // Gerçek bir uygulamada burada ses çalma API'si kullanılabilir
    console.log(`Şarkı çalınıyor: ${song.title} - ${song.artist}`);
  };
  
  const pauseSong = () => {
    setIsPlaying(false);
  };
  
  const resumeSong = () => {
    setIsPlaying(true);
  };
  
  const nextSong = () => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      setQueueIndex(queueIndex + 1);
      setCurrentSong(queue[queueIndex + 1]);
    }
  };
  
  const previousSong = () => {
    if (queue.length > 0 && queueIndex > 0) {
      setQueueIndex(queueIndex - 1);
      setCurrentSong(queue[queueIndex - 1]);
    }
  };
  
  const value = {
    currentSong,
    isPlaying,
    playSong,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong
  };
  
  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
