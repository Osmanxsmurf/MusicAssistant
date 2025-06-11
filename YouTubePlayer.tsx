import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { searchYouTube, getRelatedVideos, YoutubeSearchResult } from '@/lib/youtube-api';
import { useToast } from '@/hooks/use-toast';
import { Search, Video, TrendingUp, History } from 'lucide-react';
import YouTube from 'react-youtube';

export interface PlayerControlsHandle {
  pauseVideo: () => void;
  playVideo: () => void;
  seekForward: (seconds: number) => void;
}

interface YouTubePlayerProps {
  searchQuery?: string;
  videoId?: string;
  autoplay?: boolean;
  showRelated?: boolean;
  onVideoSelected?: (video: YoutubeSearchResult) => void;
  className?: string;
  height?: string; // Added height prop
  width?: string;  // Added width prop
}

export const YouTubePlayer = forwardRef<PlayerControlsHandle, YouTubePlayerProps>(({
  searchQuery,
  videoId,
  autoplay = false,
  showRelated = true,
  onVideoSelected,
  className = '',
  height = '390', // Default height if not provided
  width = '640',   // Default width if not provided
}: YouTubePlayerProps, ref) => {
  const [query, setQuery] = useState(searchQuery || '');
  const [searching, setSearching] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(videoId || '');
  const [searchResults, setSearchResults] = useState<YoutubeSearchResult[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<YoutubeSearchResult[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<YoutubeSearchResult[]>([]);
  const [activeTab, setActiveTab] = useState('player');
  const { toast } = useToast();
  const playerInstanceRef = useRef<any>(null); // To store the YouTube player instance
  
  // Yeni bir video seçildiğinde 
  const handleVideoSelect = (video: YoutubeSearchResult) => {
    // Mevcut video ile aynı ise işlem yapma
    if (currentVideoId === video.id) return;
    
    setCurrentVideoId(video.id);
    
    // Son izlenen videolara ekle
    const isInRecentlyWatched = recentlyWatched.some(v => v.id === video.id);
    if (!isInRecentlyWatched) {
      // Listeyi güncelle (en fazla 10 video)
      const updatedRecent = [video, ...recentlyWatched].slice(0, 10);
      setRecentlyWatched(updatedRecent);
      // localStorage'a kaydet
      localStorage.setItem('youtube_recently_watched', JSON.stringify(updatedRecent));
    }
    
    // İlgili videoları getir
    if (showRelated) {
      fetchRelatedVideos(video.id);
    }
    
    // Callback
    if (onVideoSelected) {
      onVideoSelected(video);
    }
  };
  
  // YouTube'da arama yapma
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Arama hatası",
        description: "Lütfen bir arama terimi girin",
        variant: "destructive",
      });
      return;
    }
    
    setSearching(true);
    
    try {
      const results = await searchYouTube(query, 10);
      setSearchResults(results);
      
      // Sonuç yoksa veya boşsa hata göster
      if (results.length === 0) {
        toast({
          title: "Sonuç bulunamadı",
          description: `"${query}" için sonuç bulunamadı`,
          variant: "default",
        });
      } else if (!currentVideoId) {
        // İlk video varsa ve henüz bir video seçilmemişse onu seç
        handleVideoSelect(results[0]);
      }
      
      // Video arama sekmesine geç
      setActiveTab('search');
    } catch (error) {
      console.error("YouTube arama hatası:", error);
      toast({
        title: "YouTube API Hatası",
        description: "Video aranırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };
  
  // İlgili videoları getir
  const fetchRelatedVideos = async (vidId: string) => {
    try {
      const results = await getRelatedVideos(vidId, 10);
      setRelatedVideos(results);
    } catch (error) {
      console.error("İlgili video getirme hatası:", error);
    }
  };
  
  // İlk yüklemede
  useEffect(() => {
    // Son izlenen videoları localStorage'dan al
    const savedRecent = localStorage.getItem('youtube_recently_watched');
    if (savedRecent) {
      try {
        const parsedRecent = JSON.parse(savedRecent);
        setRecentlyWatched(parsedRecent);
      } catch (error) {
        console.error("Son izlenenler parse hatası:", error);
      }
    }
    
    // Başlangıç videosu varsa ilgili videoları getir
    if (videoId) {
      setCurrentVideoId(videoId);
      fetchRelatedVideos(videoId);
    }
    // Başlangıç araması varsa
    else if (searchQuery) {
      setQuery(searchQuery);
      handleSearch();
    }
    }, [videoId, searchQuery]); // Ensure re-run if initial videoId or searchQuery prop changes

  // Effect to handle subsequent changes to the videoId prop from parent
  useEffect(() => {
    if (videoId && videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
      if (showRelated) {
        fetchRelatedVideos(videoId);
      }
      // Ensure player tab is active if a video is set via prop
      setActiveTab('player');
    }
  }, [videoId, currentVideoId, showRelated, setActiveTab]);
  
  useImperativeHandle(ref, () => ({
    pauseVideo: () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.pauseVideo === 'function') {
        playerInstanceRef.current.pauseVideo();
      }
    },
    playVideo: () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.playVideo === 'function') {
        playerInstanceRef.current.playVideo();
      }
    },
    seekForward: (seconds: number) => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.seekTo === 'function' && typeof playerInstanceRef.current.getCurrentTime === 'function') {
        const currentTime = playerInstanceRef.current.getCurrentTime();
        playerInstanceRef.current.seekTo(currentTime + seconds, true);
      }
    },
  }));

  // Video karesi
  const renderVideoCard = (video: YoutubeSearchResult, isActive: boolean = false) => (
    <div 
      key={video.id}
      className={`flex gap-2 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors ${isActive ? 'bg-primary/10' : ''}`}
      onClick={() => handleVideoSelect(video)}
    >
      <div className="flex-shrink-0 relative w-24 h-16 overflow-hidden rounded">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{video.title}</h4>
        <p className="text-xs text-muted-foreground truncate">{video.channelTitle}</p>
      </div>
    </div>
  );
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Video className="h-5 w-5 text-red-500" />
          YouTube Player
        </CardTitle>
        <CardDescription>
          Müzik videolarını keşfedin ve izleyin
        </CardDescription>
        
        {/* Arama formu */}
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            type="text"
            placeholder="YouTube'da ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searching}>
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 p-1 h-auto">
            <TabsTrigger value="player" className="flex-1 gap-1">
              <Video className="h-4 w-4" /> Oynatıcı
            </TabsTrigger>
            <TabsTrigger value="search" className="flex-1 gap-1">
              <Search className="h-4 w-4" /> Ara
            </TabsTrigger>
            <TabsTrigger value="related" className="flex-1 gap-1">
              <TrendingUp className="h-4 w-4" /> İlgili
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1">
              <History className="h-4 w-4" /> Geçmiş
            </TabsTrigger>
          </TabsList>
          
          {/* Video oynatıcı */}
          <TabsContent value="player" className="m-0 h-full">
            <div className="relative w-full h-full">
              {currentVideoId ? (
                <YouTube
                  videoId={currentVideoId}
                  opts={{
                    height: height,
                    width: width,
                    playerVars: {
                      autoplay: autoplay ? 1 : 0,
                      controls: 1,
                      rel: 0,
                      showinfo: 0,
                      modestbranding: 1,
                    },
                  }}
                  className="absolute top-0 left-0 w-full h-full"
                  onReady={(event: { target: any }) => {
                    playerInstanceRef.current = event.target;
                  }}
                  onStateChange={(_event: { data: number; target: any }) => {
                    // console.log("Player state changed:", _event.data);
                  }}
                  onError={(event: { data: number; target: any }) => {
                    console.error("YouTube Player Error:", event.data);
                    toast({
                      title: "Video Oynatma Hatası",
                      description: "Bu video oynatılamıyor. Lütfen başka bir video deneyin.",
                      variant: "destructive",
                    });
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                  <Video className="h-16 w-16 mb-4" />
                  <p>Oynatılacak video seçilmedi</p>
                  <p className="text-sm">Arama veya ilgili videolar sekmesinden bir video seçin.</p>
                </div>
              )}
            </div>
          </TabsContent>

// ...
          <TabsContent value="search" className="m-0">
            <ScrollArea className="h-80">
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-medium mb-2">Arama Sonuçları</h3>
                {searching ? (
                  // Yükleniyor durumu
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex gap-2 p-2">
                      <Skeleton className="h-16 w-24 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : searchResults.length > 0 ? (
                  // Arama sonuçları
                  searchResults.map(video => renderVideoCard(video, video.id === currentVideoId))
                ) : (
                  // Sonuç yok
                  <div className="text-center p-6">
                    <Search className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Video aramak için yukarıdaki arama kutusunu kullanın</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* İlgili videolar */}
          <TabsContent value="related" className="m-0">
            <ScrollArea className="h-80">
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-medium mb-2">İlgili Videolar</h3>
                {currentVideoId ? (
                  relatedVideos.length > 0 ? (
                    // İlgili videolar
                    relatedVideos.map(video => renderVideoCard(video, video.id === currentVideoId))
                  ) : (
                    // Yükleniyor
                    <div className="text-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">İlgili videolar yükleniyor...</p>
                    </div>
                  )
                ) : (
                  // Video seçilmedi
                  <div className="text-center p-6">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">İlgili videoları görmek için önce bir video seçin</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* İzleme geçmişi */}
          <TabsContent value="history" className="m-0">
            <ScrollArea className="h-80">
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-medium mb-2">Son İzlenenler</h3>
                {recentlyWatched.length > 0 ? (
                  // Son izlenenler
                  recentlyWatched.map(video => renderVideoCard(video, video.id === currentVideoId))
                ) : (
                  // İzleme geçmişi yok
                  <div className="text-center p-6">
                    <History className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Henüz izlenen video yok</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          {currentVideoId && (
            <a 
              href={`https://youtube.com/watch?v=${currentVideoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              YouTube'da izle
            </a>
          )}
        </div>
        
        <a 
          href="https://youtube.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <Video className="h-3 w-3" />
          YouTube
        </a>
      </CardFooter>
    </Card>
  );
});
