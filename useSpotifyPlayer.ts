import { useState, useEffect, useCallback } from 'react';
import { useSpotifyAuth } from '../context/SpotifyAuthContext';

export const useSpotifyPlayer = () => {
  const { accessToken } = useSpotifyAuth();
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Music Assistant Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        setError(`Initialization Error: ${message}`);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        setError(`Authentication Error: ${message}`);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        setError(`Account Error: ${message}`);
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        setError(`Playback Error: ${message}`);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: Spotify.PlaybackState) => {
        if (state) {
          setIsPlaying(!state.paused);
          setCurrentTrack(state.track_window.current_track);
        }
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setError(null);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player
      player.connect().then((success: boolean) => {
        if (success) {
          console.log('Successfully connected to Spotify!');
        }
      });

      setPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
      document.body.removeChild(script);
    };
  }, [accessToken]);

  // Play a track
  const play = useCallback(async (trackUri: string) => {
    if (!player || !deviceId) {
      console.error("Player or deviceId is not available.");
      return;
    }

    try {
      // Transfer playback to this device if it's not already the active device
      // This is a common pattern when using the Web Playback SDK
      await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false, // Don't start playing immediately, we'll send a separate play command
        }),
      });

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });
    } catch (err: any) {
      setError(`Play Error: ${err.message || err}`);
      console.error("Play Error:", err);
    }
  }, [player, deviceId, accessToken]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (!player) return;

    try {
      await player.togglePlay();
    } catch (err: any) {
      setError(`Toggle Play Error: ${err.message || err}`);
      console.error("Toggle Play Error:", err);
    }
  }, [player]);

  // Skip to next track
  const nextTrack = useCallback(async () => {
    if (!player) return;

    try {
      await player.nextTrack();
    } catch (err: any) {
      setError(`Next Track Error: ${err.message || err}`);
      console.error("Next Track Error:", err);
    }
  }, [player]);

  // Skip to previous track
  const previousTrack = useCallback(async () => {
    if (!player) return;

    try {
      await player.previousTrack();
    } catch (err: any) {
      setError(`Previous Track Error: ${err.message || err}`);
      console.error("Previous Track Error:", err);
    }
  }, [player]);

  // Set volume
  const setVolume = useCallback(async (volume: number) => {
    if (!player) return;

    try {
      await player.setVolume(volume);
    } catch (err: any) {
      setError(`Volume Error: ${err.message || err}`);
      console.error("Volume Error:", err);
    }
  }, [player]);

  return {
    player,
    isPlaying,
    currentTrack,
    deviceId,
    error,
    play,
    togglePlay,
    nextTrack,
    previousTrack,
    setVolume
  };
}; 