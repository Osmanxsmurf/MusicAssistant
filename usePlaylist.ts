import { useState, useCallback } from 'react';
import { useSpotifyAuth } from '../context/SpotifyAuthContext';

export const usePlaylist = () => {
  const { accessToken } = useSpotifyAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcının çalma listelerini getir
  const fetchUserPlaylists = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Çalma listeleri alınamadı');
      }

      const data = await response.json();
      setPlaylists(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Çalma listesi detaylarını getir
  const fetchPlaylistDetails = useCallback(async (playlistId: string) => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Çalma listesi detayları alınamadı');
      }

      const data = await response.json();
      setCurrentPlaylist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Yeni çalma listesi oluştur
  const createPlaylist = useCallback(async (name: string, description: string = '') => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      // Önce kullanıcı ID'sini al
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }

      const userData = await userResponse.json();

      // Çalma listesi oluştur
      const response = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: false
        })
      });

      if (!response.ok) {
        throw new Error('Çalma listesi oluşturulamadı');
      }

      const newPlaylist = await response.json();
      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Çalma listesine şarkı ekle
  const addTracksToPlaylist = useCallback(async (playlistId: string, trackUris: string[]) => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      });

      if (!response.ok) {
        throw new Error('Şarkılar çalma listesine eklenemedi');
      }

      // Çalma listesi detaylarını güncelle
      await fetchPlaylistDetails(playlistId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchPlaylistDetails]);

  // Çalma listesinden şarkı kaldır
  const removeTracksFromPlaylist = useCallback(async (playlistId: string, trackUris: string[]) => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      });

      if (!response.ok) {
        throw new Error('Şarkılar çalma listesinden kaldırılamadı');
      }

      // Çalma listesi detaylarını güncelle
      await fetchPlaylistDetails(playlistId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchPlaylistDetails]);

  return {
    playlists,
    currentPlaylist,
    isLoading,
    error,
    fetchUserPlaylists,
    fetchPlaylistDetails,
    createPlaylist,
    addTracksToPlaylist,
    removeTracksFromPlaylist
  };
}; 