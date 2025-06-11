import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '@/components/Layout';
import { ArtistDetails } from '@/components/ArtistDetails';
import { SongTable } from '@/components/SongTable';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { RecommendationEngine } from '@/components/RecommendationEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Search, User } from 'lucide-react';

import { getArtistInfo } from '@/lib/lastfm-api';
import type { Song } from '@shared/schema';

export default function ArtistPage() {
  const [_, navigate] = useLocation();
  const searchParams = window.location.search;
  const params = new URLSearchParams(searchParams);
  const artistName = params.get('name') || '';
  
  const [searchQuery, setSearchQuery] = useState(artistName);
  const [artist, setArtist] = useState('');
  const [artistInfo, setArtistInfo] = useState<any>(null);
  const [songs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Page title
  document.title = artist ? `${artist} - Müzik Asistanım` : 'Sanatçı Keşfi - Müzik Asistanım';
  
  // Sanatçı verilerini yükle
  const loadArtistData = async (name: string) => {
    if (!name) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Sanatçı adını URL'e ekle (sayfa yenilendiğinde hatırlansın)
      navigate(`/artist?name=${encodeURIComponent(name)}`, { replace: true });
      
      // Sanatçı adını state'e kaydet
      setArtist(name);
      
      // Last.fm API'den sanatçı bilgisi al
      const artistData = await getArtistInfo(name);
      setArtistInfo(artistData);
      
      // Xata veritabanından sanatçı şarkıları al (Xata removed - songs will remain empty)
      // const artistSongs = await fetchSongsByArtist(name);
      // setSongs(artistSongs);
      
    } catch (err) {
      console.error('Sanatçı bilgileri yüklenirken hata:', err);
      setError('Sanatçı bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // İlk yükleme
  useEffect(() => {
    if (artistName) {
      setSearchQuery(artistName);
      loadArtistData(artistName);
    }
  }, [artistName]);
  
  // Sanatçı araması
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadArtistData(searchQuery.trim());
    }
  };
  
  return (
    <Layout>
      <div className="container px-4 mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Sanatçı Keşfi
          </h1>
          
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
            <Input
              type="text"
              placeholder="Sanatçı adı..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Sanatçı detayları */}
            {loading ? (
              <Card>
                <CardHeader className="pb-4">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Skeleton className="h-40 w-40 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="bg-destructive/10 border-destructive/50">
                <CardHeader>
                  <CardTitle>Hata</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Lütfen sanatçı adını kontrol edin ve tekrar deneyin.</p>
                  <Button onClick={() => navigate('/')} className="mt-4">
                    Ana Sayfaya Dön
                  </Button>
                </CardContent>
              </Card>
            ) : artist ? (
              <ArtistDetails artistName={artist} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Sanatçı Keşfi</CardTitle>
                  <CardDescription>
                    Keşfetmek istediğiniz sanatçıyı arayın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Sanatçı bilgilerini görüntülemek için yukarıdaki arama kutusunu kullanın.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Sanatçı şarkıları */}
            {!loading && !error && artist && (
              <SongTable 
                songs={songs}
                title={`${artist} Şarkıları`}
                showViewAll={false}
              />
            )}
            
            {/* YouTube Player */}
            {!loading && !error && artist && (
              <YouTubePlayer searchQuery={`${artist} music official`} />
            )}
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            {/* Sanatçı önerileri */}
            {!loading && !error && artistInfo?.similar && artistInfo.similar.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Benzer Sanatçılar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {artistInfo.similar.slice(0, 5).map((similar: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => loadArtistData(similar.name)}
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-muted">
                          {similar.imageUrl ? (
                            <img 
                              src={similar.imageUrl} 
                              alt={similar.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-full w-full p-2 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{similar.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Popüler türler */}
            {!loading && !error && artistInfo?.tags && artistInfo.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Müzik Türleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {artistInfo.tags.map((tag: string, index: number) => (
                      <Button 
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                        className="capitalize"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Öneri motoru */}
            {!loading && !error && artist && (
              <RecommendationEngine
                initialMood={songs[0]?.moods?.join(', ')}
                recentlyPlayedSongs={songs.slice(0, 5)}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
