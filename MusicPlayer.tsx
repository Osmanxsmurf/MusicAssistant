import React, { useState, useEffect } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useSpotifyAuth } from '../context/SpotifyAuthContext';

export const MusicPlayer: React.FC = () => {
  const { isAuthenticated } = useSpotifyAuth();
  const {
    isPlaying,
    currentTrack,
    error,
    togglePlay,
    nextTrack,
    previousTrack,
    setVolume
  } = useSpotifyPlayer();

  const [volume, setVolumeState] = useState(0.5);
  const [progress, setProgress] = useState(0);

  // Update progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setProgress(prev => (prev + 1) % 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 text-center">
        Lütfen Spotify'a giriş yapın
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-800 text-white p-4 text-center">
        Hata: {error}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center space-x-4 w-1/3">
          {currentTrack && (
            <>
              <img
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.name}
                className="w-16 h-16 rounded"
              />
              <div>
                <div className="font-bold">{currentTrack.name}</div>
                <div className="text-sm text-gray-400">
                  {currentTrack.artists.map((artist: { name: string }) => artist.name).join(', ')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={previousTrack}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={nextTrack}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-600 h-1 rounded-full">
            <div
              className="bg-green-500 h-1 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 w-1/3 justify-end">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolumeState(newVolume);
              setVolume(newVolume);
            }}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}; 