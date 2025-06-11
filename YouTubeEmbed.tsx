import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

type PlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued' | 'ready';

interface YouTubeEmbedProps {
  videoId: string;
  className?: string;
  width?: string;
  height?: string;
  onStateChange?: (state: PlayerState) => void;
  onReady?: () => void;
  onError?: (error: number) => void;
  autoplay?: boolean;
  controls?: boolean;
  rel?: boolean;
  showInfo?: boolean;
  aspectRatio?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  className,
  width = '100%',
  height = '100%',
  onStateChange,
  onReady,
  onError,
  autoplay = false,
  controls = false,
  rel = false,
  showInfo = false,
  aspectRatio = false
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load YouTube API
  useEffect(() => {
    // If API is already loaded
    if (window.YT) {
      setIsLoaded(true);
      initializePlayer();
      return;
    }

    // Load the YouTube iframe API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // This function gets called when the YouTube API is ready
    window.onYouTubeIframeAPIReady = () => {
      setIsLoaded(true);
      initializePlayer();
    };

    return () => {
      // Cleanup player on component unmount
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying YouTube player:', err);
        }
      }
    };
  }, []);

  // Initialize the player when the API is loaded or videoId changes
  useEffect(() => {
    if (isLoaded && videoId) {
      initializePlayer();
    }
  }, [isLoaded, videoId]);

  // Convert YouTube Player state numbers to readable strings
  const getPlayerState = (stateCode: number): PlayerState => {
    switch (stateCode) {
      case -1: return 'unstarted';
      case 0: return 'ended';
      case 1: return 'playing';
      case 2: return 'paused';
      case 3: return 'buffering';
      case 5: return 'cued';
      default: return 'ready';
    }
  };

  // Initialize the YouTube player
  const initializePlayer = () => {
    if (!window.YT || !videoId || !containerRef.current) return;

    try {
      // Clean up existing player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      // Create new player
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width,
        height,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: controls ? 1 : 0,
          rel: rel ? 1 : 0,
          showinfo: showInfo ? 1 : 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3, // Hide annotations
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            if (onReady) onReady();
          },
          onStateChange: (event: any) => {
            if (onStateChange) {
              onStateChange(getPlayerState(event.data));
            }
          },
          onError: (event: any) => {
            setIsError(true);
            setErrorMessage(`YouTube Error: ${event.data}`);
            if (onError) onError(event.data);
          }
        }
      });
    } catch (err) {
      console.error('Error initializing YouTube player:', err);
      setIsError(true);
      setErrorMessage('Failed to initialize YouTube player');
    }
  };

  return (
    <div className={cn(
      "relative bg-black overflow-hidden",
      aspectRatio && "aspect-video",
      className
    )}>
      {isError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center">
          <p>{errorMessage || 'Error loading video'}</p>
        </div>
      ) : !isLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : null}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
