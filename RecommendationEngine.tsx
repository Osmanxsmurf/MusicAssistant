import { useState, useContext, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { SongCard } from '@/components/SongCard';
import { MusicPlayerContext } from '@/contexts/music-player-context';
import { MoodSelector } from '@/components/MoodSelector';
import { AVAILABLE_MOODS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { Song } from '@shared/schema';

interface RecommendationEngineProps {
  className?: string;
  initialMood?: string;
  recentlyPlayedSongs?: Song[];
  likedSongs?: Song[];
}

// Varsayılan değerler
const DEFAULT_RECOMMENDATIONS: Song[] = [
  {
    id: '1',
    title: 'Happy Day',
    artist: 'Joy Band',
    album: 'Sunshine',
    imageUrl: 'https://via.placeholder.com/300x300?text=Happy+Day',
    duration: 180,
    genre: ['Pop'],
    mood: ['happy'],
    releaseDate: '2022',
    createdAt: new Date(),
    updatedAt: new Date(),
    youtubeId: 'song1',
  },
  {
    id: '2',
    title: 'Sad Night',
    artist: 'Melancholy Group',
    album: 'Darkness',
    imageUrl: 'https://via.placeholder.com/300x300?text=Sad+Night',
    duration: 240,
    genre: ['Alternative'],
    mood: ['sad'],
    releaseDate: '2021',
    createdAt: new Date(),
    updatedAt: new Date(),
    youtubeId: 'song2',
  },
  {
    id: '3',
    title: 'Energetic Morning',
    artist: 'Power Trio',
    album: 'Awakening',
    imageUrl: 'https://via.placeholder.com/300x300?text=Energetic',
    duration: 200,
    genre: ['Rock'],
    mood: ['energetic'],
    releaseDate: '2023',
    createdAt: new Date(),
    updatedAt: new Date(),
    youtubeId: 'song3',
  }
];

export function RecommendationEngine({ 
  className, 
  initialMood,
  recentlyPlayedSongs = [],
  likedSongs = []
}: RecommendationEngineProps): JSX.Element {
  const { playSong } = useContext(MusicPlayerContext);
  const [activeTab, setActiveTab] = useState('mood');
  const [selectedMood, setSelectedMood] = useState(initialMood || '');
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [varietyLevel, setVarietyLevel] = useState(50); // 0-100 arasında çeşitlilik seviyesi
  const [apiRequestCount, setApiRequestCount] = useState(0);
  const [queryText, setQueryText] = useState('');
  const { toast } = useToast();
  
  // API istek sayısı sınırı
  const API_REQUEST_LIMIT = 10;
  
  // Öneri oluşturma fonksiyonu
  const generateRecommendations = async () => {
    if (apiRequestCount >= API_REQUEST_LIMIT) {
      toast({
        title: "API istek sınırına ulaşıldı",
        description: "Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setApiRequestCount(prev => prev + 1);
    
    try {
      // Gerçek bir uygulamada burada API'den öneriler alınır
      // Şimdilik varsayılan önerileri kullanalım
      
      // Ruh haline göre filtreleme
      const filteredSongs = selectedMood 
        ? DEFAULT_RECOMMENDATIONS.filter(song => song.mood && song.mood.includes(selectedMood.toLowerCase()))
        : DEFAULT_RECOMMENDATIONS;
      
      // Kullanıcının beğendiği ve dinlediği şarkılara göre önerileri özelleştir
      // Bu örnekte sadece varsayılan önerileri kullanıyoruz
      // Gerçek bir uygulamada burada daha karmaşık bir algoritma olabilir
      if (recentlyPlayedSongs && recentlyPlayedSongs.length > 0) {
        console.log('Son dinlenen şarkılar kullanılarak öneriler özelleştiriliyor');
      }
      
      if (likedSongs && likedSongs.length > 0) {
        console.log('Beğenilen şarkılar kullanılarak öneriler özelleştiriliyor');
      }
      
      setRecommendations(filteredSongs);
    } catch (error) {
      console.error('Recommendations error:', error);
      toast({
        title: "Hata",
        description: "Öneriler alınırken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Ruh hali seçildiğinde önerileri güncelle
  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    // Burada hemen önerileri güncelleyebiliriz
    generateRecommendations();
  };
  
  // Sayfa yüklenirken mevcut AVAILABLE_MOODS'u kontrol et
  useEffect(() => {
    console.log('Kullanılabilir ruh halleri:', AVAILABLE_MOODS);
  }, []);
  
  // Şarkı çalma işlemi
  const handlePlaySong = (song: Song) => {
    playSong(song);
    toast({
      title: "Şarkı çalınıyor",
      description: `${song.title} - ${song.artist}`,
    });
  };
  
  return (
    <div className={`w-full ${className}`}>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mood">Ruh Haline Göre</TabsTrigger>
          <TabsTrigger value="search">Arama</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mood" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Ruh halinizi seçin</h3>
                <MoodSelector 
                  selectedMood={selectedMood} 
                  onMoodSelect={handleMoodSelect} 
                />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Yeni keşif seviyesi</h4>
                  <Slider
                    defaultValue={[varietyLevel]}
                    max={100}
                    step={10}
                    onValueChange={(values: number[]) => setVarietyLevel(values[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Benzer</span>
                    <span>Yeni Keşifler</span>
                  </div>
                </div>
                
                <Button 
                  onClick={generateRecommendations} 
                  disabled={loading || selectedMood === ''}
                  className="w-full"
                >
                  {loading ? "Yükleniyor..." : "Önerileri Göster"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Önerilen şarkılar */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Size Özel Öneriler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((song) => (
                  <SongCard 
                    key={song.id} 
                    song={song} 
                    onPlay={() => handlePlaySong(song)} 
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Şarkı veya sanatçı ara..."
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                  />
                  <Button 
                    onClick={generateRecommendations} 
                    disabled={loading || !queryText.trim()}
                  >
                    Ara
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Arama sonuçları */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Arama Sonuçları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((song) => (
                  <SongCard 
                    key={song.id} 
                    song={song} 
                    onPlay={() => handlePlaySong(song)} 
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
