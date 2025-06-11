import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import debounce from 'lodash/debounce';

export const ArtistSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  // Debounce search to avoid too many API calls
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setArtists([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/search_artist?query=${encodeURIComponent(query)}`);
      setArtists(response.data.artists);
    } catch (error) {
      console.error('Error searching artists:', error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="relative mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sanatçı ara..."
          className="w-full p-4 pl-12 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <svg
          className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Artist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {artists.map((artist) => (
          <div
            key={artist.id}
            onClick={() => handleArtistClick(artist.id)}
            className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="relative pb-[100%]">
              <img
                src={artist.images[0]?.url || '/default-artist.png'}
                alt={artist.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <svg
                    className="w-12 h-12 text-white opacity-0 group-hover:opacity-100"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{artist.name}</h3>
              <p className="text-sm text-gray-400">
                {artist.genres?.slice(0, 2).join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {!isLoading && searchQuery && artists.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p>Sanatçı bulunamadı.</p>
        </div>
      )}
    </div>
  );
}; 