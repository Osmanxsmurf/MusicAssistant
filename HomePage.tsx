import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '@/components/Layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


import { 
  Music, 
  Youtube
} from 'lucide-react';
import { AVAILABLE_MOODS } from '@/lib/constants';

import MediaCard from '@/components/MediaCard';
import { SongTable } from '@/components/SongTable';
import { useSpotify } from '../contexts/SpotifyContext';
import { useMood } from '@/lib/ai/context/MoodContext';
import { useSpotifyAuth } from '../context/SpotifyAuthContext';
import { useAssistant } from '../contexts/AssistantContext';
import { type Song } from '@shared/schema';

// Spotify API entegrasyonu için importlar
import {
  getRecommendationsSpotify as getRecommendations,
  getFeaturedPlaylists,
  getNewReleases,
  getTopTracks,
  getUserPlaylists,
  // Types
  type SpotifyTrack,
  type SpotifySimplifiedAlbum,
  type SpotifyPlaylist
} from '@/lib/spotify-api';
import * as LastfmAPI from '@/lib/lastfm-api'; // Last.fm API'si için import
import { AssistantService, AssistantResponse, Intent, ExtractedEntities } from '@/lib/ai/AssistantService';

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  type: 'text' | 'tracks';
  content: string | any[];
  timestamp: Date;
}

export default function HomePage() {
  const [_, navigate] = useLocation();
  const [selectedMood, setSelectedMood] = useState<string>(AVAILABLE_MOODS[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMoodRecommendations, setLoadingMoodRecommendations] = useState<boolean>(false);
  const [userInput, setUserInput] = useState('');
  const [assistantConversation, setAssistantConversation] = useState<AssistantMessage[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState<SpotifyTrack[]>([]);
  const [newReleases, setNewReleases] = useState<SpotifySimplifiedAlbum[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [moodSongs, setMoodSongs] = useState<SpotifyTrack[]>([]); // Mood based songs from Spotify

  // Last.fm Artist Info State
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [artistInfo, setArtistInfo] = useState<LastfmAPI.LastfmArtist | null>(null);
  const [artistError, setArtistError] = useState('');
  const [isArtistLoading, setIsArtistLoading] = useState(false);

  // YouTube Play State
  const [youtubeTrackId, setYoutubeTrackId] = useState('');
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(false);

  const { 
    assistantService,
    isAssistantLoading: assistantContextLoading,
    assistantError
  } = useAssistant();

  const { accessToken, isAuthenticated } = useSpotifyAuth();
  const { searchQuery, setSearchQuery, searchResults, isSearchLoading, searchError } = useSpotify();
  const { moodDetector, isMoodDetectorLoading, moodDetectorError, essentiaInstance } = useMood(); // Correct destructuring for MoodContext
  const [mappedSearchResults, setMappedSearchResults] = useState<Song[]>([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (isAuthenticated && accessToken) {
        try {
          const playlistsData = await getUserPlaylists(accessToken);
          if (playlistsData && Array.isArray(playlistsData.items)) {
            setUserPlaylists(playlistsData.items);
          } else if (Array.isArray(playlistsData)) {
             setUserPlaylists(playlistsData);
          } else {
            setUserPlaylists([]);
            console.warn("Unexpected playlist data structure:", playlistsData);
          }
        } catch (err) {
          console.error("Failed to fetch user playlists:", err);
          setUserPlaylists([]);
        }
      } else {
        setUserPlaylists([]);
      }
    };
    fetchPlaylists();
  }, [isAuthenticated, accessToken]);
  
  // Sayfa başlığı
  document.title = 'Müzik Asistanım - Kişiselleştirilmiş Müzik Önerileri';

  // API verilerini yükle
  useEffect(() => {
    const fetchData = async () => {
      if (accessToken) {
        setLoading(true);
        try {
          // Trend şarkıları getir
          const topTracks = await getTopTracks(accessToken);
          setTrendingTracks(topTracks.slice(0, 10));
          
          // Yeni çıkanları getir
          const releases = await getNewReleases(accessToken);
          setNewReleases(releases.slice(0, 10));
          
          // Öne çıkan çalma listelerini getir
          const featuredPlaylistsResponse = await getFeaturedPlaylists(accessToken);
          setFeaturedPlaylists(featuredPlaylistsResponse?.playlists?.items?.slice(0, 6) || []);
          
          // Mood bazlı önerileri getir
          await fetchMoodRecommendations();
        } catch (error) {
          console.error('API veri çekme hatası:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [accessToken]);
  
  // Ruh hali değiştiğinde önerileri yenile
  useEffect(() => {
    if (accessToken) {
      fetchMoodRecommendations();
    }
  }, [selectedMood, accessToken]);
  
  // Ruh haline göre önerileri getir
  const fetchMoodRecommendations = async () => {
    if (!accessToken) return;
    setLoadingMoodRecommendations(true);
    try {
      const recommendations = await getRecommendations({
        seed_genres: [selectedMood.toLowerCase()],
        limit: 10
      }, accessToken);
      
      setMoodSongs(recommendations);
    } catch (error) {
      console.error('Mood önerileri getirme hatası:', error);
    } finally {
      setLoadingMoodRecommendations(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      await searchQuery;
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleYoutubeSearch = async () => {
    if (!youtubeQuery.trim()) return;
    setIsYoutubeLoading(true);
    setYoutubeError(null);
    try {
      const results = await assistantService.searchYouTube(youtubeQuery);
      setYoutubeResults(results);
    } catch (error) {
      setYoutubeError('YouTube araması sırasında bir hata oluştu');
      console.error('YouTube search error:', error);
    } finally {
      setIsYoutubeLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !accessToken) return;

    const userMessage: AssistantMessage = {
      id: Date.now().toString() + '_user',
      sender: 'user',
      type: 'text',
      content: userInput,
      timestamp: new Date(),
    };
    setAssistantConversation(prev => [...prev, userMessage]);
    setIsAssistantLoading(true);
    setUserInput('');

    try {
      const assistant = AssistantService.getInstance(import.meta.env.VITE_HF_API_TOKEN);
      const assistantOutput: AssistantResponse = await assistant.processMessage(userInput);

      const responseMessage: AssistantMessage = {
        id: Date.now().toString() + '_assistant_text',
        sender: 'assistant',
        type: 'text',
        content: assistantOutput.text,
        timestamp: new Date(),
      };
      setAssistantConversation(prev => [...prev, responseMessage]);

      if (assistantOutput.action) {
        console.log("Assistant action:", assistantOutput.action);
        // Example: Handle PLAY_SONG intent
        if (assistantOutput.action.type === Intent.PLAY_SONG && assistantOutput.action.payload) {
          const payload = assistantOutput.action.payload as ExtractedEntities;
          console.log(`AI Action: Play song - ${payload.songName || 'Unknown Song'} by ${payload.artistName || 'Unknown Artist'}`);
          // Here you would typically call a function to interact with a music player
          // e.g., playMusic(payload.songName, payload.artistName);
        }
        // TODO: Add more handlers for other intents as needed
      }

    } catch (err) {
      console.error('Asistanla iletişim hatası:', err);
      const errorMessage: AssistantMessage = {
        id: Date.now().toString() + '_assistant_error',
        sender: 'assistant',
        type: 'text',
        content: 'Üzgünüm, asistanla iletişim kurarken bir sorun oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
      };
      setAssistantConversation(prev => [...prev, errorMessage]);
    }
    setIsAssistantLoading(false);
  };

  const handleYouTubePlay = async (trackName: string, artistName: string) => {
    setYoutubeTrackId(''); // Clear previous video
    const youtubeService = AssistantService.getInstance(import.meta.env.VITE_HF_API_TOKEN); // Reuse AssistantService for YouTube
    const youtubeId = await youtubeService.getYouTubeVideoId(trackName, artistName);
    if (youtubeId) {
      setYoutubeTrackId(youtubeId);
    } else {
      console.error('YouTube ID bulunamadı.');
    }
  };

  const handleSpotifyPlayTrack = async (trackUri: string) => {
    if (isAuthenticated && accessToken) {
      console.log(`Attempting to play Spotify URI: ${trackUri}. Playback disabled due to missing SpotifyPlayerContext.`);
    } else {
      console.warn("Spotify ile giriş yapılmamış. Parça oynatılamaz.");
    }
  };

  const handleArtistInfoSearch = async () => {
    if (!artistSearchQuery.trim()) {
      setArtistError('Lütfen bir sanatçı adı girin.');
      return;
    }
    setIsArtistLoading(true);
    setArtistError('');
    setArtistInfo(null);
    try {
      const info = await LastfmAPI.getArtistInfo(artistSearchQuery);
      if (info) {
        setArtistInfo(info);
      } else {
        setArtistError('Sanatçı bulunamadı veya bilgi alınamadı.');
      }
    } catch (error) {
      console.error('Last.fm sanatçı bilgisi çekme hatası:', error);
      setArtistError('Sanatçı bilgisi çekilirken bir hata oluştu.');
    } finally {
      setIsArtistLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Müzik Asistanı</h1>
          <p className="text-lg text-muted-foreground">
            Spotify ve YouTube'dan müzik arayın, AI ile öneriler alın
          </p>
        </div>

        {/* Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Spotify Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Spotify'da Ara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Şarkı veya sanatçı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearchLoading}>
                  {isSearchLoading ? 'Aranıyor...' : 'Ara'}
                </Button>
              </div>
              {searchError && (
                <p className="text-red-500 mt-2">{searchError}</p>
              )}
            </CardContent>
          </Card>

          {/* YouTube Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5" />
                YouTube'da Ara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="YouTube'da ara..."
                  value={youtubeQuery}
                  onChange={(e) => setYoutubeQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleYoutubeSearch()}
                />
                <Button onClick={handleYoutubeSearch} disabled={isYoutubeLoading}>
                  {isYoutubeLoading ? 'Aranıyor...' : 'Ara'}
                </Button>
              </div>
              {youtubeError && (
                <p className="text-red-500 mt-2">{youtubeError}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Spotify Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Spotify Sonuçları</CardTitle>
              </CardHeader>
              <CardContent>
                <SongTable
                  songs={searchResults}
                  onSongClick={(song: Song) => { if (song.spotifyId) { handleSpotifyPlayTrack(`spotify:track:${song.spotifyId}`); } }}
                />
              </CardContent>
            </Card>
          )}

          {/* YouTube Results */}
          {youtubeResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>YouTube Sonuçları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {youtubeResults.map((video) => (
                    <MediaCard
                      key={video.id}
                      title={video.title}
                      subtitle={video.channelTitle}
                      imageUrl={video.thumbnailUrl}
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}