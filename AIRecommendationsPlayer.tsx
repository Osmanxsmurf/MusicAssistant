import React, { useState } from 'react';
import { Song } from '@/lib/types/music-types';
import { searchYouTube } from '@/lib/youtube-api';
import { useMusicPlayer } from '@/contexts/music-player-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Loader2, ExternalLink } from 'lucide-react';

interface AIRecommendationsPlayerProps {
  songs?: Song[];
  playableResults?: boolean;
  className?: string;
}

export const AIRecommendationsPlayer: React.FC<AIRecommendationsPlayerProps> = ({ 
  songs = [], 
  playableResults = false,
  className 
}) => {
  const { playSong } = useMusicPlayer();
  const { toast } = useToast();
  const [loadingSongIds, setLoadingSongIds] = useState<string[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Record<string, string>>({});

  // Görüntüleme için sınırlı sayıda şarkı göster
  const displaySongs = songs.slice(0, 6);

  const handlePlaySong = async (song: Song) => {
    try {
      // Şarkı zaten YouTube ID'sine sahipse, doğrudan oynat
      if (song.youtubeId) {
        playSong({
          ...song,
          youtubeUrl: `https://www.youtube.com/watch?v=${song.youtubeId}`
        });
        return;
      }

      // Önbellekte bir YouTube sonucu var mı kontrol et
      if (youtubeResults[song.id]) {
        playSong({
          ...song,
          youtubeId: youtubeResults[song.id],
          youtubeUrl: `https://www.youtube.com/watch?v=${youtubeResults[song.id]}`
        });
        return;
      }

      // YouTube'da ara
      setLoadingSongIds(prev => [...prev, song.id]);
      
      const searchQuery = `${song.artist} - ${song.title} official audio`;
      const results = await searchYouTube(searchQuery, 1);
      
      setLoadingSongIds(prev => prev.filter(id => id !== song.id));
      
      if (results.length === 0) {
        toast({
          title: "Şarkı bulunamadı",
          description: `"${song.title}" şarkısı YouTube'da bulunamadı.`,
          variant: "destructive"
        });
        return;
      }
      
      const videoId = results[0].videoId;
      
      // Sonucu önbelleğe al
      setYoutubeResults(prev => ({
        ...prev,
        [song.id]: videoId
      }));
      
      // Şarkıyı oynat
      playSong({
        ...song,
        youtubeId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
      });
      
      toast({
        title: "Şarkı çalınıyor",
        description: `"${song.title}" şarkısı çalınıyor.`
      });
    } catch (error) {
      console.error("Şarkı oynatılırken hata oluştu:", error);
      toast({
        title: "Hata",
        description: "Şarkı oynatılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      setLoadingSongIds(prev => prev.filter(id => id !== song.id));
    }
  };

  const openYouTubeSearch = (song: Song) => {
    const searchQuery = encodeURIComponent(`${song.artist} - ${song.title} official audio`);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
  };

  if (!playableResults || songs.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Önerilen Şarkılar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {displaySongs.map((song) => (
          <Card key={song.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <div className="font-medium truncate">{song.title}</div>
                <div className="text-sm text-muted-foreground truncate">{song.artist}</div>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                    disabled={loadingSongIds.includes(song.id)}
                    onClick={() => handlePlaySong(song)}
                  >
                    {loadingSongIds.includes(song.id) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Çal
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openYouTubeSearch(song)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
