import React, { useEffect, useState, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onEnd?: () => void;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  width?: string | number;
  height?: string | number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SimpleYouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onEnd,
  isPlaying = true,
  onPlay,
  onPause,
  width = '100%',
  height = '300px'
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  
  // YouTube API'yi yükle
  useEffect(() => {
    if (window.YT) {
      setApiLoaded(true);
      return;
    }
    
    // API yükleme
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    // API yükleme tamamlandığında çağrılacak fonksiyon
    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
    };
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    // Temizleme
    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);
  
  // API yüklendiğinde player'ı oluştur
  useEffect(() => {
    if (!apiLoaded || !containerRef.current) return;
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      width,
      height,
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          setIsReady(true);
        },
        onStateChange: (event: any) => {
          // Video bittiğinde
          if (event.data === window.YT.PlayerState.ENDED && onEnd) {
            onEnd();
          }
          
          // Video oynatılmaya başladığında
          if (event.data === window.YT.PlayerState.PLAYING && onPlay) {
            onPlay();
          }
          
          // Video duraklatıldığında
          if (event.data === window.YT.PlayerState.PAUSED && onPause) {
            onPause();
          }
        }
      }
    });
    
    // Temizleme
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [apiLoaded, videoId]);
  
  // İsPlaying durumu değiştiğinde videoyu oynat/duraklat
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isReady]);
  
  // VideoId değiştiğinde yeni videoyu yükle
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    playerRef.current.loadVideoById(videoId);
  }, [videoId, isReady]);
  
  return (
    <div className="youtube-player-container">
      <div ref={containerRef} className="youtube-player" />
    </div>
  );
};

export default SimpleYouTubePlayer;
