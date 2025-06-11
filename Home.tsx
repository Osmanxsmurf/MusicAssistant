import React, { useState, useEffect } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { usePlaylist } from '../hooks/usePlaylist';
import axios from 'axios';

export const Home: React.FC = () => {
  const [trendingPlaylists, setTrendingPlaylists] = useState<any[]>([]);
  const [featuredContent, setFeaturedContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { play } = useSpotifyPlayer();
  const { fetchPlaylistDetails } = usePlaylist();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [trendsResponse, playlistsResponse] = await Promise.all([
          axios.get('/api/trends'),
          axios.get('/api/playlists')
        ]);

        setTrendingPlaylists(trendsResponse.data.trends.playlists.items);
        setFeaturedContent(playlistsResponse.data.playlists.playlists.items);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching content:', error);
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handlePlayTrack = (trackUri: string) => {
    play(trackUri);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative h-full flex items-center justify-center text-center">
          <div className="max-w-3xl px-4">
            <h1 className="text-5xl font-bold mb-4">Müzik Dünyasına Hoş Geldiniz</h1>
            <p className="text-xl mb-8">Milyonlarca şarkı ve çalma listesi arasında keşfe çıkın</p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
              Keşfetmeye Başla
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Trending Playlists */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Haftanın Trendleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => fetchPlaylistDetails(playlist.id)}
              >
                <div className="relative pb-[100%]">
                  <img
                    src={playlist.images[0]?.url}
                    alt={playlist.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm">{playlist.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Content */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Öne Çıkanlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => fetchPlaylistDetails(playlist.id)}
              >
                <div className="relative pb-[100%]">
                  <img
                    src={playlist.images[0]?.url}
                    alt={playlist.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm">{playlist.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Played */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Son Çalınanlar</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="space-y-4">
              {/* Bu kısım gerçek verilerle doldurulacak */}
              <div className="flex items-center space-x-4 p-2 hover:bg-gray-700 rounded-lg cursor-pointer">
                <img
                  src="https://i.scdn.co/image/ab67616d00004851b0fe6a55d9b9c8fd7f7a4f8a"
                  alt="Album Cover"
                  className="w-16 h-16 rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium">Şarkı Adı</h4>
                  <p className="text-sm text-gray-400">Sanatçı Adı</p>
                </div>
                <button
                  onClick={() => handlePlayTrack('spotify:track:123')}
                  className="p-2 text-green-500 hover:text-green-400"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}; 