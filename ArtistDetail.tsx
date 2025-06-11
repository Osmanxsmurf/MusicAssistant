import React, { useState, useEffect } from 'react';

import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import axios from 'axios';

interface ArtistDetailProps {
  params: {
    artistId: string;
  };
}

export const ArtistDetail: React.FC<ArtistDetailProps> = ({ params }) => {
    const { artistId } = params;
  const [artist, setArtist] = useState<any>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { play } = useSpotifyPlayer();

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistId) return;

      setIsLoading(true);
      try {
        const [artistResponse, topTracksResponse, albumsResponse] = await Promise.all([
          axios.get(`/api/artist_info/${artistId}`),
          axios.get(`/api/artist_top_tracks/${artistId}`),
          axios.get(`/api/artist_albums/${artistId}`)
        ]);

        setArtist(artistResponse.data);
        setTopTracks(topTracksResponse.data.tracks);
        setAlbums(albumsResponse.data.albums);
      } catch (error) {
        console.error('Error fetching artist data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

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

  if (!artist) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Sanatçı bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 flex items-center space-x-8">
            <img
              src={artist.images[0]?.url}
              alt={artist.name}
              className="w-48 h-48 rounded-full shadow-xl"
            />
            <div>
              <h1 className="text-5xl font-bold mb-4">{artist.name}</h1>
              <p className="text-xl text-gray-300">
                {artist.genres?.join(', ')}
              </p>
              <p className="text-gray-400 mt-2">
                {artist.followers?.total.toLocaleString()} takipçi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Tracks */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Popüler Şarkılar</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-700">
              {topTracks.map((track, index) => (
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

        {/* Albums */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Albümler</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
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
                  <p className="text-sm text-gray-400">
                    {new Date(album.release_date).getFullYear()} • {album.album_type}
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