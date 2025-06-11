import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { YouTubePlayer } from '../YouTubePlayer'; 
import { getVideoDetails, getRelatedVideos, YoutubeSearchResult } from '../../lib/youtube-api';
import { Song } from '../../lib/types/music-types'; 
import * as HybridAPI from '../../lib/hybrid-music-api';
import { searchYouTube } from '../../lib/youtube-api'; // searchYouTube doğrudan import edildi 

// Lucide React icons
import { 
  Play, 
  Heart, 
  HeartOff,
  Share2, 
  ListPlus, 
  ArrowLeft, 
  Music, 
  FileText, 
  Video, 
  Info, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle,
  Loader
} from 'lucide-react';

// UI components from shadcn/ui or similar
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface SongDetailsPageProps {
  userId?: string; 
}

const SongDetailsPage: React.FC<SongDetailsPageProps> = ({ userId }) => {
  const [, params] = useRoute<{ songId: string }>('/song/:songId');
  const [, setLocation] = useLocation(); 
  const songId = params?.songId;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoDetails, setVideoDetails] = useState<YoutubeSearchResult | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YoutubeSearchResult[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); 
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);

  useEffect(() => {
    if (!songId) {
      setLoading(false);
      return;
    }

    const loadSongDetails = async () => {
      setLoading(true);
      try {
        const songData = await HybridAPI.getSongDetails(songId);
        if (!songData) {
          console.error('Şarkı bulunamadı:', songId);
          setSong(null);
          throw new Error('Şarkı bulunamadı');
        }
        setSong(songData);

        const favoritesStr = localStorage.getItem('favoriteSongs'); 
        const favorites: string[] = favoritesStr ? JSON.parse(favoritesStr) : [];
        setIsFavorite(favorites.includes(songId));

        let ytQuery = '';
        if (songData.youtubeId) {
          ytQuery = songData.youtubeId;
          const videoData = await getVideoDetails(ytQuery);
          setVideoDetails(videoData);
          if (videoData?.videoId) {
            const related = await getRelatedVideos(videoData.videoId, 5);
            setRelatedVideos(related.filter(v => v.thumbnailUrl));
          }
        } else if (songData.title && songData.artist) {
          ytQuery = `${songData.title} ${songData.artist}`;
          const searchResults = await searchYouTube(ytQuery, 1);
          if (searchResults && searchResults.length > 0 && searchResults[0].videoId) {
            setVideoDetails(searchResults[0]);
            const related = await getRelatedVideos(searchResults[0].videoId, 5);
            setRelatedVideos(related.filter(v => v.thumbnailUrl));
          } else {
            setVideoDetails(null); 
            setRelatedVideos([]);
          }
        }

      } catch (error) {
        console.error('Şarkı detayları yüklenirken hata:', error);
        setSong(null); 
      } finally {
        setLoading(false);
      }
    };

    loadSongDetails();
  }, [songId]); 

  const handleFavoriteToggle = () => {
    if (!song || !songId) return;

    const favoritesStr = localStorage.getItem('favoriteSongs');
    let currentFavorites: string[] = favoritesStr ? JSON.parse(favoritesStr) : [];

    if (isFavorite) {
      currentFavorites = currentFavorites.filter(id => id !== songId);
    } else {
      if (!currentFavorites.includes(songId)) {
        currentFavorites.push(songId);
      }
    }
    localStorage.setItem('favoriteSongs', JSON.stringify(currentFavorites));
    setIsFavorite(!isFavorite);
  };

  const fetchLyricsIfNeeded = async () => {
    if (!song || lyrics || lyricsLoading) return; 
    setLyricsLoading(true);
    try {
      const fetchedLyrics = await HybridAPI.getLyrics(song.title, song.artist);
      setLyrics(fetchedLyrics || 'Şarkı sözü bulunamadı.');
    } catch (error) {
      console.error('Şarkı sözleri alınırken hata:', error);
      setLyrics('Şarkı sözleri yüklenirken bir hata oluştu.');
    } finally {
      setLyricsLoading(false);
    }
  };
  
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    if (tabValue === 'lyrics') {
      fetchLyricsIfNeeded();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg font-semibold text-gray-700 mt-4">Şarkı detayları yükleniyor...</p>
      </div>
                    Beğeni Sayısı
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {videoDetails.likeCount ? parseInt(videoDetails.likeCount).toLocaleString() : 'Bilinmiyor'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">
                    Yüklenme Tarihi
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {videoDetails.publishedAt ? new Date(videoDetails.publishedAt).toLocaleDateString() : 'Bilinmiyor'}
                  </Typography>
                </>
              )}
              
              {song.moodData && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ruh Hali
                  </Typography>
                  <Box mt={1}>
                    {song.moodData.primaryMood && (
                      <Chip 
                        label={song.moodData.primaryMood} 
                        color="primary" 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                    )}
                    {song.moodData.secondaryMoods && 
                      song.moodData.secondaryMoods.map((mood: MoodType) => (
                        <Chip 
                          key={mood} 
                          label={mood} 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ))
                    }
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
        
        {videoDetails?.description && (
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Açıklama
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-line', 
                maxHeight: '200px', 
                overflowY: 'auto',
                mt: 1,
                p: 1,
                bgcolor: 'background.paper',
                borderRadius: 1
              }}
            >
              {videoDetails.description}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  const renderLyrics = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Şarkı Sözleri
        </Typography>
        
        {lyricsLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : lyrics ? (
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-line',
              mt: 2,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {lyrics}
          </Typography>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Şarkı sözleri bulunamadı.
          </Typography>
        )}
      </Box>
    );
  };
  
  const renderRelatedVideos = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          İlgili Videolar
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : relatedVideos.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            İlgili video bulunamadı.
          </Typography>
        ) : (
          <>
            <Grid container spacing={2}>
              {relatedVideos.map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video.videoId}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                  >
                    <CardContent sx={{ p: 1 }}>
                      <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 1 }}>
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} 
                        />
                      </Box>
                      <Typography variant="subtitle2" noWrap>{video.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{video.channelTitle}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Benzer Şarkılar
              </Typography>
              
              <Button 
                variant="outlined" 
                color="primary"
                onClick={async () => {
                  if (!song) return;
                  
                  setLoading(true);
                  try {
                    // Hibrit API ile benzer şarkıları getir
                    const similarSongs = await HybridAPI.getSimilarSongs(song, 6);
                    if (similarSongs.length > 0) {
                      setRelatedVideos(similarSongs.map(s => ({
                        id: s.youtubeId || s.id,
                        videoId: s.youtubeId || s.id,
                        title: `${s.artist} - ${s.title}`,
                        description: s.album || '',
                        channelTitle: s.artist,
                        publishedAt: s.releaseDate || '',
                        thumbnailUrl: s.imageUrl
                      })));
                    }
                  } catch (error) {
                    console.error('Benzer şarkılar getirilirken hata:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Daha Fazla Benzer Şarkı Getir
              </Button>
            </Box>
          </>
        )}
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!song) {
    return (
      <Box textAlign="center" my={4}>
        <Typography variant="h6" gutterBottom>
          Şarkı bulunamadı
        </Typography>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Geri Dön
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Geri Dön
      </Button>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <YouTubePlayer 
              videoId={song.youtubeId || ''} 
              height="300px"
              autoplay={false}
            />
          </Box>
          
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {song.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {song.artist}
            </Typography>
            
            <Box display="flex" mt={2} mb={3}>
              <Button 
                variant="contained" 
                startIcon={<PlayArrowIcon />}
                sx={{ mr: 1 }}
              >
                Oynat
              </Button>
              
              <IconButton 
                color={isFavorite ? "primary" : "default"} 
                onClick={handleFavoriteToggle}
                aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              
              <IconButton aria-label="Çalma listesine ekle">
                <PlaylistAddIcon />
              </IconButton>
              
              <IconButton aria-label="Paylaş">
                <ShareIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box mb={3} display="flex" borderBottom={1} borderColor="divider">
            <Button 
              startIcon={<InfoIcon />}
              onClick={() => handleTabChange('info')}
              color={activeTab === 'info' ? 'primary' : 'inherit'}
              sx={{ 
                pb: 1, 
                borderBottom: activeTab === 'info' ? 2 : 0,
                borderColor: 'primary.main'
              }}
            >
              Bilgiler
            </Button>
            
            <Button 
              startIcon={<LyricsIcon />}
              onClick={() => handleTabChange('lyrics')}
              color={activeTab === 'lyrics' ? 'primary' : 'inherit'}
              sx={{ 
                pb: 1, 
                ml: 2,
                borderBottom: activeTab === 'lyrics' ? 2 : 0,
                borderColor: 'primary.main'
              }}
            >
              Şarkı Sözleri
            </Button>
            
            <Button 
              startIcon={<MusicNoteIcon />}
              onClick={() => handleTabChange('related')}
              color={activeTab === 'related' ? 'primary' : 'inherit'}
              sx={{ 
                pb: 1, 
                ml: 2,
                borderBottom: activeTab === 'related' ? 2 : 0,
                borderColor: 'primary.main'
              }}
            >
              Benzer Şarkılar
            </Button>
          </Box>
          
          <Box p={1}>
            {activeTab === 'info' && renderSongInfo()}
            {activeTab === 'lyrics' && renderLyrics()}
            {activeTab === 'related' && renderRelatedVideos()}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MovieIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  YouTube Yorumları
                </Typography>
              </Box>
              
              <Box bgcolor="background.paper" p={2} borderRadius={1} mb={2}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  YouTube yorumlarını görmek için video sayfasını ziyaret edin
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                  target="_blank"
                >
                  YouTube'da Aç
                </Button>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <CommentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Yorum Yap
                </Typography>
              </Box>
              
              <Box display="flex" mb={2}>
                <IconButton color="primary">
                  <ThumbUpIcon />
                </IconButton>
                <IconButton>
                  <ThumbDownIcon />
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1, alignSelf: 'center' }}>
                  Bu şarkıyı değerlendirin
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <MusicNoteIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Önerilen Diğer Şarkılar
                </Typography>
              </Box>
              
              <List>
                {relatedVideos.slice(0, 3).map((video) => (
                  <ListItem 
                    key={video.videoId}
                    button 
                    sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        variant="rounded" 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        sx={{ width: 50, height: 50 }}
                      />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={video.title} 
                      secondary={video.channelTitle}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                      secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SongDetailsPage;
