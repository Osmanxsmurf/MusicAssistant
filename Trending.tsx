import React, { useState, useEffect } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import axios from 'axios';

export const Trending: React.FC = () => {
  const [trendingContent, setTrendingContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { play } = useSpotifyPlayer();

  useEffect(() => {
    const fetchTrendingContent = async () => {
      try {
        const response = await axios.get('/api/trends');
        setTrendingContent(response.data.trends);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching trending content:', error);
        setIsLoading(false);
      }
    };

    fetchTrendingContent();
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative h-[40vh] bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl overflow-hidden mb-12">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative h-full flex items-center justify-center text-center">
            <div className="max-w-3xl px-4">
              <h1 className="text-4xl font-bold mb-4">Haftanın Trendleri</h1>
              <p className="text-xl">En popüler şarkılar ve çalma listeleri</p>
            </div>
          </div>
        </div>

        {/* Featured Playlists */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Öne Çıkan Çalma Listeleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingContent?.playlists?.items.map((playlist: any) => (
              <div
                key={playlist.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
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

        {/* Global Top 50 */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Global Top 50</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-700">
              {trendingContent?.tracks?.items.map((track: any, index: number) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-gray-400">{index + 1}</span>
                    </div>
                    <img
                      src={track.album.images[0]?.url}
                      alt={track.name}
                      className="w-12 h-12 rounded"
                    />
                    <div>
                      <h4 className="font-medium">{track.name}</h4>
                      <p className="text-sm text-gray-400">
                        {track.artists.map((artist: any) => artist.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayTrack(track.uri)}
                    className="p-2 text-green-500 hover:text-green-400"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New Releases */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Yeni Çıkanlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingContent?.albums?.items.map((album: any) => (
              <div
                key={album.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="relative pb-[100%]">
                  <img
                    src={album.images[0]?.url}
                    alt={album.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{album.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {album.artists.map((artist: any) => artist.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}; 