import { Song } from '@shared/schema';
import { searchYouTube, YoutubeSearchResult } from './youtube-api';

// YouTube video ID regex matcher
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

// Extract YouTube video ID from a URL
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

// Create search query from a song
export function createSearchQuery(song: Song): string {
  let query = `${song.artist} - ${song.title}`;
  
  // Add "official audio" for better results
  query += ' official audio';
  
  return query;
}

// Find a YouTube song by artist and title
export async function findYouTubeSong(song: Song): Promise<YoutubeSearchResult | null> {
  try {
    const query = createSearchQuery(song);
    const searchResults = await searchYouTube(query, 1);
    
    if (searchResults && searchResults.length > 0) {
      return searchResults[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error finding YouTube song:', error);
    return null;
  }
}

// Interface for a simple YouTube player API
export interface IYouTubePlayer {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  getState: () => Promise<string>;
  setVolume: (volume: number) => void;
  getVolume: () => Promise<number>;
  destroy: () => void;
}

// Create an iframe player
function createYouTubeIframePlayer(videoId: string, containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=1&playsinline=1`;
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.style.border = 'none';
  
  container.appendChild(iframe);
}

// Create a simple YouTube player API to control the iframe
export function createYouTubePlayerAPI(videoId: string, containerId: string): IYouTubePlayer {
  // Create the iframe
  createYouTubeIframePlayer(videoId, containerId);
  
  // Return player API
  return {
    play() {
      window.postMessage({ action: 'play', containerId }, '*');
    },
    pause() {
      window.postMessage({ action: 'pause', containerId }, '*');
    },
    seekTo(seconds: number) {
      window.postMessage({ action: 'seekTo', seconds, containerId }, '*');
    },
    async getCurrentTime(): Promise<number> {
      // This would normally use postMessage and a promise, 
      // but for simplicity we're mocking it
      return 0;
    },
    async getDuration(): Promise<number> {
      // Mocked for simplicity
      return 0;
    },
    async getState(): Promise<string> {
      // Mocked for simplicity
      return 'playing';
    },
    setVolume(volume: number) {
      window.postMessage({ action: 'setVolume', volume, containerId }, '*');
    },
    getVolume(): Promise<number> {
      // Mocked for simplicity
      return Promise.resolve(100);
    },
    destroy() {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    }
  };
}
