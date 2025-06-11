import React, { useState, useEffect } from 'react';
import { usePlaylist } from '../hooks/usePlaylist';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

export const PlaylistManager: React.FC = () => {
  const {
    playlists,
    currentPlaylist,
    isLoading,
    error,
    fetchUserPlaylists,
    fetchPlaylistDetails,
    createPlaylist,
    addTracksToPlaylist,
    removeTracksFromPlaylist
  } = usePlaylist();

  const { play } = useSpotifyPlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    fetchUserPlaylists();
  }, [fetchUserPlaylists]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const playlist = await createPlaylist(newPlaylistName, newPlaylistDescription);
    if (playlist) {
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    }
  };

  const handlePlayTrack = (trackUri: string) => {
    play(trackUri);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Hata: {error}</div>;
  }

  return (
    <div className="p-4">
      {/* Yeni Çalma Listesi Oluşturma Formu */}
      <form onSubmit={handleCreatePlaylist} className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Yeni Çalma Listesi Oluştur</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Çalma Listesi Adı</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Çalma listesi adı"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Açıklama</label>
            <textarea
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Çalma listesi açıklaması"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Çalma Listesi Oluştur
          </button>
        </div>
      </form>

      {/* Çalma Listeleri */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Çalma Listeleriniz</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700"
              onClick={() => fetchPlaylistDetails(playlist.id)}
            >
              <img
                src={playlist.images[0]?.url || '/default-playlist.png'}
                alt={playlist.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg">{playlist.name}</h3>
                <p className="text-sm text-gray-400">
                  {playlist.tracks.total} şarkı
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seçili Çalma Listesi Detayları */}
      {currentPlaylist && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={currentPlaylist.images[0]?.url || '/default-playlist.png'}
              alt={currentPlaylist.name}
              className="w-24 h-24 object-cover rounded"
            />
            <div>
              <h2 className="text-2xl font-bold">{currentPlaylist.name}</h2>
              <p className="text-gray-400">{currentPlaylist.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            {currentPlaylist.tracks.items.map((item: any) => (
              <div
                key={item.track.id}
                className="flex items-center justify-between p-2 hover:bg-gray-700 rounded"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.track.album.images[0]?.url}
                    alt={item.track.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <div className="font-medium">{item.track.name}</div>
                    <div className="text-sm text-gray-400">
                      {item.track.artists.map((artist: any) => artist.name).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePlayTrack(item.track.uri)}
                    className="p-2 text-green-500 hover:text-green-400"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeTracksFromPlaylist(currentPlaylist.id, [item.track.uri])}
                    className="p-2 text-red-500 hover:text-red-400"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 