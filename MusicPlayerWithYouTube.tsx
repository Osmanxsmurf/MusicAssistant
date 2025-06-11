import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Song } from '@shared/schema';
// import { 
//   addToRecentlyPlayed, 
//   likeSong, 
//   unlikeSong, 
//   fetchLikedSongs 
// } from '@/lib/xata';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Drawer } from 'vaul';
import { SongCard } from '@/components/SongCard';
import { MusicPlayerContext } from '@/contexts/music-player-context';
import { useMobile } from '@/hooks/use-mobile';
import { searchYouTube } from '@/lib/youtube-api';
import { extractYouTubeId } from '@/lib/youtube-player';
import { YouTubeEmbed } from './YouTubeEmbed';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Heart,
  Loader2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { AudioVisualizer } from '@/components/ui/visualizer';

interface MusicPlayerWithYouTubeProps {
  className?: string;
}

export const MusicPlayerWithYouTube: React.FC<MusicPlayerWithYouTubeProps> = ({ className }) => {
  const { currentSong, playSong } = React.useContext(MusicPlayerContext);
  const { toast } = useToast();
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  
  // YouTube player states - playerState oynatıcının güncel durumunu takip etmek için kullanılıyor
  const [playerState, setPlayerState] = useState<'playing' | 'paused' | 'loading' | 'error' | 'ended'>('paused');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  
  // Reference to track if we need to update recently played
  const lastPlayedRef = useRef<string | null>(null);
  
  // Load user's liked songs
  useEffect(() => {
    const loadLikedSongs = async () => {
      try {
        // const liked = await fetchLikedSongs('currentUser');
        // if (liked) {
        //   setLikedSongs(liked.map((song: Song) => song.id));
        // }
        setLikedSongs([]); // Initialize as empty
      } catch (error: any) {
        console.error("Error loading liked songs:", error);
      }
    };
    
    loadLikedSongs();
  }, []);
  
  // Update recently played when song changes
  useEffect(() => {
    if (currentSong && currentSong.id && currentSong.id !== lastPlayedRef.current) {
      lastPlayedRef.current = currentSong.id;
      
      // Add to recently played in the backend
      // // addToRecentlyPlayed('currentUser', currentSong.id)
      // //  .catch((error: Error) => {
      // //    console.error("Error adding to recently played:", error);
      // //  });
    }
  }, [currentSong]);
  
  // Add current song to queue if it's not already there
  useEffect(() => {
    if (currentSong && !queue.some(song => song.id === currentSong.id)) {
      setQueue(prev => [...prev, currentSong]);
      setQueueIndex(queue.length);
    }
  }, [currentSong, queue]);
  
  // Handle YouTube ID lookup when song changes
  useEffect(() => {
    if (!currentSong) return;
    
    // If song already has a YouTube ID, use it
    if (currentSong.youtubeId) {
      setYoutubeId(currentSong.youtubeId);
      setIsSearching(false);
      return;
    }
    
    // If song has a YouTube URL, extract the ID
    if (currentSong.youtubeUrl) {
      const id = extractYouTubeId(currentSong.youtubeUrl);
      if (id) {
        setYoutubeId(id);
        setIsSearching(false);
        return;
      }
    }
    
    // If song has an audio URL and it's from YouTube, extract the ID
    if (currentSong.audioUrl) {
      const id = extractYouTubeId(currentSong.audioUrl);
      if (id) {
        setYoutubeId(id);
        setIsSearching(false);
        return;
      }
    }
    
    // Otherwise, search YouTube for the song
    setIsSearching(true);
    setPlaybackError(null);
    
    const searchQuery = `${currentSong.artist} - ${currentSong?.title || 'No song selected'} official audio`;
    
    searchYouTube(searchQuery, 1)
      .then(results => {
        if (results.length === 0) {
          setPlaybackError("Şarkı YouTube'da bulunamadı");
          setIsSearching(false);
          return;
        }
        
        const videoId = results[0].id;
        setYoutubeId(videoId);
        setIsSearching(false);
      })
      .catch(error => {
        console.error('Error searching YouTube:', error);
        setPlaybackError("YouTube'da arama yaparken bir hata oluştu");
        setIsSearching(false);
      });
  }, [currentSong]);
  
  const handleNext = () => {
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      playSong(queue[nextIndex]);
    } else {
      toast({
        title: "Sıranın Sonu",
        description: "Sıranın sonuna geldiniz",
      });
    }
  };
  
  const handlePrevious = () => {
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      playSong(queue[prevIndex]);
    } else {
      toast({
        title: "Sıranın Başı",
        description: "Sıranın başındasınız",
      });
    }
  };
  
  const handleLike = async () => {
    if (!currentSong || !currentSong.id) return;

    const isLiked = likedSongs.includes(currentSong.id);

    if (isLiked) {
      // Unlike song (local state update)
      setLikedSongs(likedSongs.filter(id => id !== currentSong.id));
      toast({
        title: "Beğenilenlerden Çıkarıldı (Lokal)",
        description: `${currentSong.title} artık beğenilen şarkılarınız arasında değil.`,
      });
    } else {
      // Like song (local state update)
      setLikedSongs([...likedSongs, currentSong.id]);
      toast({
        title: "Beğenilen Şarkılara Eklendi (Lokal)",
        description: `${currentSong.title} beğenilen şarkılarınıza eklendi.`,
      });
    }
  };
  
  // Render nothing if no song is selected
  if (!currentSong) return null;
  
  // YouTube player state change handler
  const handleYouTubeStateChange = (state: any) => {
    switch (state) {
      case 'playing':
        setPlayerState('playing');
        break;
      case 'paused':
        setPlayerState('paused');
        break;
      case 'buffering':
        setPlayerState('loading');
        break;
      case 'ended':
        setPlayerState('ended');
        handleNext();
        break;
      case 'unstarted':
      case 'cued':
        setPlayerState('paused');
        break;
    }
  };
  
  // Toggle volume control visibility
  const toggleVolumeControl = () => {
    setShowVolumeControl(prev => !prev);
  };
  
  // Display the appropriate volume icon based on level
  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 50) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };
  
  // Render the full player for mobile or mini player for desktop
  const isMobile = useMobile();
  if (isMobile) {
    return (
      <Drawer.Root open={isFullPlayerOpen} onOpenChange={setIsFullPlayerOpen}>
        {/* Mini player visible when full player is closed */}
        <div className={className}>
          <Drawer.Trigger asChild>
            <div className="cursor-pointer w-full bg-card border-t border-muted flex flex-col">
              {/* Visualizer */}
              <div className="h-1 overflow-hidden">
                <AudioVisualizer playing={playerState === 'playing'} />
              </div>
              
              {/* Player controls */}
              <div className="px-4 py-2 flex items-center gap-2">
                {/* Album art */}
                <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={currentSong.coverImage || 'https://placehold.co/200/gray/white?text=No+Image'} 
                    alt={`${currentSong.title} by ${currentSong.artist}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Song info */}
                <div className="flex-1 min-w-0 ml-0">
                  <h4 className="font-medium truncate text-sm">{currentSong.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
                </div>
                
                {/* Play/pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening drawer
                    // To be implemented once the YouTube player control API is hooked up
                  }}
                  disabled={isSearching || playerState === 'loading'}
                >
                  {isSearching ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : playerState === 'playing' ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                </Button>
              </div>
            </div>
          </Drawer.Trigger>
        </div>
        
        {/* Full screen player on mobile */}
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[10px] bg-background flex flex-col">
            <div className="p-4 overflow-y-auto flex-1 flex flex-col">
              {/* Drag handle */}
              <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6"></div>
              
              {/* YouTube player */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg mb-4">
                {isSearching ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-sm">Şarkı aranıyor...</span>
                  </div>
                ) : playbackError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-4 text-center">
                    <p>{playbackError}</p>
                  </div>
                ) : youtubeId ? (
                  <YouTubeEmbed 
                    videoId={youtubeId} 
                    onStateChange={handleYouTubeStateChange}
                    autoplay={true}
                    aspectRatio={true}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <p>Video bulunamadı</p>
                  </div>
                )}
              </div>
              
              {/* Song info */}
              <div className="mt-2 text-center">
                <h2 className="text-xl font-bold">{currentSong.title}</h2>
                <p className="text-muted-foreground">{currentSong.artist}</p>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center mt-8 gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground transition-colors h-10 w-10"
                  onClick={handlePrevious}
                >
                  <SkipBack size={20} />
                </Button>
                
                <Button
                  variant="default"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  disabled={isSearching || !youtubeId}
                  onClick={() => {
                    // To be implemented once the YouTube player control API is hooked up
                  }}
                >
                  {isSearching ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : playerState === 'playing' ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground transition-colors h-10 w-10"
                  onClick={handleNext}
                >
                  <SkipForward size={20} />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors h-8 w-8",
                    likedSongs.includes(currentSong.id) && "text-red-500 hover:text-red-600"
                  )}
                  onClick={handleLike}
                >
                  <Heart size={18} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                </Button>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                    onClick={toggleVolumeControl}
                  >
                    <VolumeIcon />
                  </Button>
                  
                  {showVolumeControl && (
                    <div className="absolute bottom-full right-0 mb-2 p-3 bg-popover border rounded-lg shadow-md w-32 z-50">
                      <Slider
                        value={[volume]}
                        max={100}
                        step={1}
                        onValueChange={(values) => setVolume(values[0])}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Queue */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Sıradakiler</h3>
                <div className="space-y-1">
                  {queue.slice(queueIndex + 1, queueIndex + 4).map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onPlay={() => {
                        const newIndex = queue.findIndex(s => s.id === song.id);
                        if (newIndex !== -1) {
                          setQueueIndex(newIndex);
                          playSong(song);
                        }
                      }}
                    />
                  ))}
                  
                  {queue.length <= queueIndex + 1 && (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                      Sırada başka şarkı yok
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }
  
  // Desktop version with sheet
  return (
    <>
      <div className={className}>
        <Sheet>
          <SheetTrigger asChild>
            <div className="cursor-pointer w-full bg-card border-t border-muted flex flex-col">
              {/* Visualizer */}
              <div className="h-1 overflow-hidden">
                <AudioVisualizer playing={playerState === 'playing'} />
              </div>
              
              {/* Playback controls */}
              <div className="px-4 py-2 flex items-center gap-4">
                {/* Album art */}
                <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={currentSong.coverImage || 'https://placehold.co/200/gray/white?text=No+Image'} 
                    alt={`${currentSong.title} by ${currentSong.artist}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-sm">{currentSong.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
                  {playbackError && <p className="text-xs text-red-500">{playbackError}</p>}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                    onClick={handlePrevious}
                  >
                    <SkipBack size={18} />
                  </Button>
                  
                  <Button
                    variant="default"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    disabled={isSearching || !youtubeId}
                    onClick={() => {
                      // To be implemented once the YouTube player control API is hooked up
                    }}
                  >
                    {isSearching ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : playerState === 'playing' ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                    onClick={handleNext}
                  >
                    <SkipForward size={18} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors h-8 w-8",
                      likedSongs.includes(currentSong.id) && "text-red-500 hover:text-red-600"
                    )}
                    onClick={handleLike}
                  >
                    <Heart size={18} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                      onClick={toggleVolumeControl}
                    >
                      <VolumeIcon />
                    </Button>
                    
                    {showVolumeControl && (
                      <div className="absolute bottom-full right-0 mb-2 p-3 bg-popover border rounded-lg shadow-md w-32 z-50">
                        <Slider
                          value={[volume]}
                          max={100}
                          step={1}
                          onValueChange={(values) => setVolume(values[0])}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-[400px] p-0 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* YouTube player */}
              <div className="w-full aspect-video relative bg-black">
                {isSearching ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-sm">Şarkı aranıyor...</span>
                  </div>
                ) : playbackError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-4 text-center">
                    <p>{playbackError}</p>
                  </div>
                ) : youtubeId ? (
                  <YouTubeEmbed 
                    videoId={youtubeId} 
                    onStateChange={handleYouTubeStateChange}
                    autoplay={true}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <p>Video bulunamadı</p>
                  </div>
                )}
              </div>
              
              {/* Song info and player */}
              <div className="p-4 flex-1 overflow-hidden flex flex-col">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{currentSong.title}</h2>
                  <p className="text-muted-foreground">{currentSong.artist}</p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground transition-colors h-10 w-10"
                    onClick={handlePrevious}
                  >
                    <SkipBack size={20} />
                  </Button>
                  
                  <Button
                    variant="default"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    disabled={isSearching || !youtubeId}
                    onClick={() => {
                      // To be implemented once the YouTube player control API is hooked up
                    }}
                  >
                    {isSearching ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : playerState === 'playing' ? (
                      <Pause size={24} />
                    ) : (
                      <Play size={24} />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground transition-colors h-10 w-10"
                    onClick={handleNext}
                  >
                    <SkipForward size={20} />
                  </Button>
                </div>
                
                {/* Queue */}
                <div className="mt-6 flex-1 overflow-hidden">
                  <h3 className="text-sm font-medium mb-2">Sıra</h3>
                  <div className="overflow-y-auto max-h-[calc(100%-2rem)] space-y-1 pr-2">
                    {queue.map((song, index) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        onPlay={() => {
                          setQueueIndex(index);
                          playSong(song);
                        }}
                        isCompact={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
