import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
// MUI Component imports will be replaced or re-added individually
import {
  Youtube as YoutubeIconLucide, // Renamed to avoid conflict with component
  Play,
  Search as SearchIconLucide,
  Send,
  Loader2,
  ThumbsUp,  // For Spotify Recommendations
  Flame,     // For Spotify Featured/Popular
  ListMusic  // For User Playlists
} from 'lucide-react';
import { YoutubeSearchResult, searchYouTube } from '../lib/youtube-api';
import * as HybridAPI from '../lib/hybrid-music-api';
import { Song } from '@shared/schema';
import { AssistantService, Intent, ExtractedEntities } from '../lib/ai/AssistantService'; // AI Assistant Service
import { useSpotifyAuth } from '@/context/SpotifyAuthContext'; // Path corrected to singular 'context'
import {
  getUserPlaylists,
  getFeaturedPlaylists,
  getRecommendationsSpotify,
  SpotifyPlaylist,
  SpotifyTrack,
} from '../lib/spotify-api';

// Kategoriler
// Ruh halleri - Bunları Song objesindeki mood alanına göre filtrelemek için kullanacağız (ŞİMDİLİK YORUMDA)
// const moodFilters = ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Melancholic', 'Hopeful', 'Angry', 'Peaceful', 'Mysterious'];

const musicCategories = [
  { id: 'spotify-my-playlists', name: 'Listelerim', icon: <ListMusic size={20} /> },
  { id: 'spotify-recommendations', name: 'Sana Özel', icon: <ThumbsUp size={20} /> },
  { id: 'spotify-featured', name: 'Öne Çıkanlar', icon: <Flame size={20} /> },
  { id: 'youtube-trending', name: 'YouTube Trend', icon: <YoutubeIconLucide size={20} /> }
];

// Türler (ŞİMDİLİK YORUMDA)
// const genreFilters = [
//   'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Country', 
//   'Latin', 'Folk', 'Blues', 'Metal', 'Reggae', 'World', 'Indie'
// ];

interface MusicDiscoveryPageProps {
  userId?: string;
}

// Bu helper fonksiyonları artık hibrit API kullandığımız için kaldırıyoruz

const MusicDiscoveryPage: React.FC<MusicDiscoveryPageProps> = (/*{ userId = 'default-user' }*/) => { // userId şimdilik kullanılmıyor
  const { accessToken, isAuthenticated, isLoading: authLoading } = useSpotifyAuth(); // Correctly use isLoading and alias it to authLoading
  const [activeCategory, setActiveCategory] = useState('youtube-trending'); // Default to YouTube Trending
  const [loading, setLoading] = useState(false); // General loading for non-Spotify actions like YouTube search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]); // For hybrid search, can be kept or removed
  // Hybrid API states - commented out for Spotify focus
  // const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  // const [popularSongs, setPopularSongs] = useState<Song[]>([]);
  // const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
  const [youtubeTrending, setYoutubeTrending] = useState<YoutubeSearchResult[]>([]);
  const [aiRecommendedSongs, setAiRecommendedSongs] = useState<Song[]>([]); // State for AI recommendations

  // Spotify States
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [spotifyRecommendations, setSpotifyRecommendations] = useState<SpotifyTrack[]>([]);
  const [isLoadingUserPlaylists, setIsLoadingUserPlaylists] = useState(false);
  const [isLoadingFeaturedPlaylists, setIsLoadingFeaturedPlaylists] = useState(false);
  const [isLoadingSpotifyRecommendations, setIsLoadingSpotifyRecommendations] = useState(false);
  
  // const [originalTrendingSongs, setOriginalTrendingSongs] = useState<Song[]>([]);
  // const [originalPopularSongs, setOriginalPopularSongs] = useState<Song[]>([]);
  // const [originalRecommendedSongs, setOriginalRecommendedSongs] = useState<Song[]>([]);

  // const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  // const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  // AI Assistant States
  const [assistant, setAssistant] = useState<AssistantService | null>(null);
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'assistant', text: string, action?: any }[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  
  // İlk yükleme (Hybrid API için - şimdilik yorumda)
  // useEffect(() => {
  //   loadInitialData();
  // }, [userId]);
  
  // Kategori değiştiğinde
  useEffect(() => {
    if (activeCategory === 'youtube' && youtubeTrending.length === 0) {
      fetchYouTubeTrending();
    }
  }, [activeCategory]);

  // Initialize AI Assistant Service
  useEffect(() => {
    setAssistant(AssistantService.getInstance());
  }, []);

  // AI Assistant message handler
  const handleSendMessage = async () => {
    if (!userInput.trim() || !assistant) return;

    const newUserMessage = { sender: 'user' as const, text: userInput };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsAssistantLoading(true);
    const currentInput = userInput;
    setUserInput(''); // Clear input immediately

    try {
      const response = await assistant.processMessage(currentInput);
      const assistantMessage = {
        sender: 'assistant' as const,
        text: response.text || 'Bir sorun oluştu.',
        action: response.action,
      };
      setChatMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Handle actions from the assistant
      if (response.action) {
        console.log('Assistant action:', response.action);
        const payload = response.action.payload as ExtractedEntities;
        // Check if payload is indeed ExtractedEntities and has songName
        const songToSearch = payload?.songName;

        if (response.action.type === Intent.PLAY_SONG && songToSearch) {
          // If the intent is to play a song and we have a song name, set it for search
          setSearchQuery(songToSearch);
          console.log(`AI suggests playing/searching for song: ${songToSearch}. Triggering search.`);
          // Optionally, you could automatically call handleSearch here:
          // await handleSearch(new Event('submit') as any, songToSearch);
        } else if (response.action.type === Intent.PLAY_SONG && response.originalQuery) {
          // Fallback to original query if no specific song name in payload
          setSearchQuery(response.originalQuery);
          console.log(`AI suggests playing/searching based on original query: ${response.originalQuery}. Triggering search.`);
        } else if (response.action.type === Intent.GET_RECOMMENDATIONS_MOOD || response.action.type === Intent.RECOMMEND_SONG) {
          console.log(`AI Recommendation Intent: ${response.action.type}, Payload:`, payload);
          // TODO: Implement fetchSpotifyRecommendations(payload) and update setAiRecommendedSongs with the result.
          // For now, let's clear previous recommendations or set a placeholder.
          setAiRecommendedSongs([]); // Clear or set placeholder songs for UI testing
          // Example placeholder to test UI (remove later):
          // setAiRecommendedSongs([
          //   { id: 'ai-rec-1', title: 'AI Recommended Song 1', artist: 'AI Artist', source: 'spotify', spotifyUri: 'spotify:track:placeholder1' },
          //   { id: 'ai-rec-2', title: 'AI Recommended Song 2', artist: 'AI Artist', source: 'youtube', youtubeVideoId: 'placeholder2' },
          // ]);
        }
      }
    } catch (error) {
      console.error('Error processing message with AI assistant:', error);
      const errorMessage = {
        sender: 'assistant' as const,
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      };
      setChatMessages(prevMessages => [...prevMessages, errorMessage]);
    }

    setIsAssistantLoading(false);
  };

  // Fetch Spotify Data when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken && !authLoading) {
      const fetchUserPlaylists = async () => {
        setIsLoadingUserPlaylists(true);
        try {
          const data = await getUserPlaylists(accessToken, 20);
          if (data && data.items) {
            setUserPlaylists(data.items);
          }
        } catch (error) {
          console.error('Error fetching user playlists:', error);
          setUserPlaylists([]); // Clear on error
        }
        setIsLoadingUserPlaylists(false);
      };

      const fetchFeaturedPlaylistsData = async () => {
        setIsLoadingFeaturedPlaylists(true);
        try {
          const data = await getFeaturedPlaylists(accessToken, 20, 0, 'TR'); // Default to TR for now
          if (data && data.playlists && data.playlists.items) {
            setFeaturedPlaylists(data.playlists.items);
          }
        } catch (error) {
          console.error('Error fetching featured playlists:', error);
          setFeaturedPlaylists([]); // Clear on error
        }
        setIsLoadingFeaturedPlaylists(false);
      };

      const fetchSpotifyRecommendationsData = async () => {
        setIsLoadingSpotifyRecommendations(true);
        try {
          // Example: Get recommendations based on some seed genres
          // TODO: Allow user to select seed genres or use their top genres if available
          const data = await getRecommendationsSpotify(
            { seed_genres: ['pop', 'turkish-pop', 'electronic'], limit: 20 }, 
            accessToken
          );
          // getRecommendationsSpotify directly returns SpotifyTrack[] or []
          setSpotifyRecommendations(data);
        } catch (error) {
          console.error('Error fetching Spotify recommendations:', error);
          setSpotifyRecommendations([]); // Clear on error
        }
        setIsLoadingSpotifyRecommendations(false);
      };

      fetchUserPlaylists();
      fetchFeaturedPlaylistsData();
      fetchSpotifyRecommendationsData();
    } else if (!authLoading) { // If not authenticated or no token, and auth is not loading
      setUserPlaylists([]);
      setFeaturedPlaylists([]);
      setSpotifyRecommendations([]);
    }
  }, [accessToken, isAuthenticated, authLoading]);

  const fetchYouTubeTrending = async () => {
    setLoading(true); // General loading for this action
    try {
      const currentYear = new Date().getFullYear();
      const results = await searchYouTube(`trending music ${currentYear}`, 20);
      setYoutubeTrending(results);
    } catch (error) {
      console.error('YouTube trend videoları alınırken hata:', error);
      setYoutubeTrending([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    // setActiveCategory('search'); // Or some other indicator if needed
    try {
      const songs = await HybridAPI.getEnrichedSongs(searchQuery, 20, accessToken || undefined);
      setSearchResults(songs);
      if (songs.length === 0) {
        console.log('Arama sonucu bulunamadı.');
      }
    } catch (error) {
      console.error('Hibrit arama sırasında hata:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song: Song | SpotifyTrack) => {
    // Assuming both Song and SpotifyTrack have a compatible 'id' field for navigation
    // If SpotifyTrack is passed, its 'id' will be used.
    // If the Song object from HybridAPI is used, its 'id' or 'spotifyId' might be relevant.
    let idToNavigate: string | undefined = undefined;
    if ('album' in song) { // Likely SpotifyTrack
        idToNavigate = song.id;
    } else { // Likely Song from HybridAPI
        idToNavigate = song.id || (song as any).spotifyId;
    }
    if (idToNavigate) {
        setLocation(`/song/${idToNavigate}`);
    } else {
        console.warn('Cannot navigate: song ID is missing', song);
    }
  };

  const handleYouTubePlay = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  if (authLoading && !isAuthenticated) { // Show loading only if not yet authenticated and auth is in progress
    return <div className="p-4 text-center text-lg">Spotify bilgileri yükleniyor...</div>;
  }

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isAssistantLoading]);

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      {/* Search Bar */}
      <div className="mb-6 sticky top-0 bg-gray-100 py-4 z-10 shadow-sm">
        <div className="flex max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Şarkı, sanatçı veya albüm ara..."
            className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 outline-none text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-r-lg flex items-center transition-colors duration-150"
          >
            <SearchIconLucide size={22} />
            <span className="ml-2 hidden sm:inline">Ara</span>
          </button>
        </div>
      </div>

      {/* Category Tabs - Simplified to only show YouTube for now */} 
      <div className="mb-6 flex justify-center space-x-2 border-b border-gray-300 pb-2">
        {musicCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-2 px-4 rounded-md font-medium transition-all duration-150 ${ 
              activeCategory === cat.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-purple-400`}
          >
            <span className="flex items-center">
              {React.cloneElement(cat.icon, { size: 20 })}
              <span className="ml-2">{cat.name}</span>
            </span>
          </button>
        ))}
      </div>

      {!isAuthenticated && (
        <div className="p-6 bg-yellow-100 border border-yellow-300 rounded-lg text-center text-yellow-800">
          Spotify özelliklerini (çalma listeleriniz, size özel öneriler) görmek için lütfen yukarıdaki menüden giriş yapın.
        </div>
      )}

      {isAuthenticated && (
        <>
          {/* Spotify User Playlists */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-5 text-gray-800 tracking-tight">Çalma Listelerim</h2>
            {isLoadingUserPlaylists ? (
              <div className="text-center py-5"><p className="text-gray-600">Çalma listeleriniz yükleniyor...</p></div>
            ) : userPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {userPlaylists.map((playlist) => (
                  <div key={playlist.id} className="bg-white shadow-xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer" onClick={() => window.open(playlist.external_urls.spotify, '_blank')}>
                    <img 
                      src={playlist.images[0]?.url || 'https://via.placeholder.com/300/000000/FFFFFF/?text=Playlist'}
                      alt={playlist.name} 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-md text-gray-900 truncate" title={playlist.name}>{playlist.name}</h3>
                      <p className="text-xs text-gray-500 truncate">Sahibi: {playlist.owner.display_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-5">Kullanıcı çalma listeniz bulunamadı veya hiç çalma listeniz yok.</p>
            )}
          </section>

          {/* Spotify Featured Playlists */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-5 text-gray-800 tracking-tight">Öne Çıkanlar</h2>
            {isLoadingFeaturedPlaylists ? (
              <div className="text-center py-5"><p className="text-gray-600">Öne çıkanlar yükleniyor...</p></div>
            ) : featuredPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {featuredPlaylists.map((playlist) => (
                  <div key={playlist.id} className="bg-white shadow-xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer" onClick={() => window.open(playlist.external_urls.spotify, '_blank')}>
                    <img 
                      src={playlist.images[0]?.url || 'https://via.placeholder.com/300/000000/FFFFFF/?text=Featured'}
                      alt={playlist.name} 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-md text-gray-900 truncate" title={playlist.name}>{playlist.name}</h3>
                      <p className="text-xs text-gray-500 truncate h-8 overflow-hidden">{playlist.description || 'Spotify tarafından hazırlandı'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-5">Öne çıkan çalma listesi bulunamadı.</p>
            )}
          </section>

          {/* Spotify Recommendations */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-5 text-gray-800 tracking-tight">Sana Özel</h2>
            {isLoadingSpotifyRecommendations ? (
              <div className="text-center py-5"><p className="text-gray-600">Öneriler yükleniyor...</p></div>
            ) : spotifyRecommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {spotifyRecommendations.map((track) => (
                  <div key={track.id} className="bg-white shadow-xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer" onClick={() => handlePlaySong(track)}>
                    <img 
                      src={track.album.images[0]?.url || 'https://via.placeholder.com/300/000000/FFFFFF/?text=Track'}
                      alt={track.name} 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-md text-gray-900 truncate" title={track.name}>{track.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-5">Size özel öneri bulunamadı.</p>
            )}
          </section>
        </>
      )}

      {/* YouTube Trending Section (conditionally rendered if activeCategory is 'youtube-trending') */}
      {activeCategory === 'youtube-trending' && (
        <section className="mb-10">
          <h2 className="text-3xl font-bold mb-5 text-gray-800 tracking-tight">YouTube Trendleri</h2>
          {loading && youtubeTrending.length === 0 ? (
            <div className="text-center py-5"><p className="text-gray-600">YouTube trendleri yükleniyor...</p></div>
          ) : youtubeTrending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {youtubeTrending.map((video) => (
                <div key={video.id} className="bg-white shadow-xl rounded-lg overflow-hidden">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="w-full h-52 object-cover cursor-pointer transform hover:scale-105 transition-transform duration-200 ease-in-out"
                    onClick={() => handleYouTubePlay(video.id)}
                  />
                  <div className="p-4">
                    <h3 
                      className="font-semibold text-lg text-gray-900 truncate cursor-pointer hover:text-purple-600 transition-colors duration-150" 
                      title={video.title}
                      onClick={() => handleYouTubePlay(video.id)}
                    >
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{video.channelTitle}</p>
                    <button 
                        onClick={() => handleYouTubePlay(video.id)}
                        className="mt-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center w-full transition-colors duration-150"
                    >
                        <Play size={18} className="mr-2" /> YouTube'da İzle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-5">YouTube trendleri bulunamadı.</p>
          )}
        </section>
      )}
      
      {/* AI Recommended Songs Section */}
      {aiRecommendedSongs.length > 0 && (
        <section className="mb-10">
          <h2 className="text-3xl font-bold mb-5 text-gray-800 tracking-tight">Yapay Zeka Önerileri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {aiRecommendedSongs.map((song) => (
              <div key={song.id} className="bg-white shadow-xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out">
                <img 
                  src={song.imageUrl || 'https://via.placeholder.com/300/000000/FFFFFF/?text=' + encodeURIComponent(song.title)}
                  alt={song.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate" title={song.title}>{song.title}</h3>
                  <p className="text-sm text-gray-600 truncate" title={song.artist}>{song.artist}</p>
                  <button 
                    onClick={() => handlePlaySong(song)} 
                    className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                  >
                    <Play size={18} className="mr-2" /> Oynat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Results from Hybrid API (if searchQuery is present and searchResults exist) */}
      {searchQuery && searchResults.length > 0 && (
         <section className="mb-10">
            <h2 className="text-3xl font-bold mb-5 text-gray-800 tracking-tight">"{searchQuery}" için Arama Sonuçları</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {searchResults.map((song) => (
                <div key={song.id || (song as any).spotifyId} className="bg-white shadow-xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer" onClick={() => handlePlaySong(song)}>
                  <img 
                    src={song.imageUrl || song.coverImage || 'https://via.placeholder.com/300/000000/FFFFFF/?text=Song'}
                    alt={song.title} 
                    className="w-full h-48 object-cover" 
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-md text-gray-900 truncate" title={song.title}>{song.title}</h3>
                    <p className="text-xs text-gray-500 truncate mb-2">{song.artist}</p>
                     <button 
                        onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}
                        className="mt-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center w-full transition-colors duration-150"
                    >
                        <Play size={18} className="mr-2" /> Dinle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
      )}
       {searchQuery && !loading && searchResults.length === 0 && (
        <p className="text-gray-600 text-center py-5">"{searchQuery}" için arama sonucu bulunamadı.</p>
      )}

      {/* AI Assistant Chat UI */}
      <section className="mt-8 p-4 border-t border-gray-700 fixed bottom-0 left-0 right-0 bg-white shadow-top z-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Marjinal Asistan</h2>
          <div ref={chatContainerRef} className="h-72 overflow-y-auto bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`p-3 rounded-xl max-w-[70%] break-words ${msg.sender === 'user' ? 'bg-purple-600 text-white self-end ml-auto' : 'bg-slate-600 text-gray-100 self-start mr-auto'}`}>
                {msg.text}
              </div>
            ))}
            {isAssistantLoading && (
              <div className="p-3 rounded-xl bg-slate-600 text-gray-100 self-start mr-auto flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Asistan düşünüyor...</p>
              </div>
            )}
          </div>
          <div className="flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isAssistantLoading && handleSendMessage()}
              placeholder="Marjinal Asistan'a mesaj gönder..."
              className="flex-grow p-3 text-sm text-gray-700 border border-r-0 border-gray-300 rounded-l-full focus:ring-purple-500 focus:border-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
              disabled={isAssistantLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isAssistantLoading || !userInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold p-2 px-4 rounded-r-md disabled:opacity-50 transition-colors duration-150"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}; // End of MusicDiscoveryPage component

export default MusicDiscoveryPage;
