// YouTube API anahtarını ortam değişkeninden alıyoruz
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 
const API_URL = 'https://www.googleapis.com/youtube/v3';

export interface YoutubeSearchResult {
  id: string;
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount?: string;
  likeCount?: string;
}

/**
 * YouTube'da arama yapar
 * @param query Arama sorgusu
 * @param maxResults Maksimum sonuç sayısı
 * @returns Arama sonuçları
 */
export async function searchYouTube(query: string, maxResults: number = 10): Promise<YoutubeSearchResult[]> {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      key: API_KEY,
    });
    const response = await fetch(`${API_URL}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.info('YouTube sonuçları bulunamadı.');
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    }));
  } catch (error) {
    console.error('YouTube arama hatası:', error);
    return [];
  }
}

/**
 * YouTube video detaylarını alır
 * @param videoId Video ID
 * @returns Video detayları
 */
export async function getVideoDetails(videoId: string): Promise<YoutubeSearchResult | null> {
  try {
    const params = new URLSearchParams({
      part: 'snippet,statistics',
      id: videoId,
      key: API_KEY,
    });
    const response = await fetch(`${API_URL}/videos?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('YouTube video detayları bulunamadı.');
      return null;
    }
    
    const video = data.items[0];
    
    return {
      id: video.id,
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount,
    };
  } catch (error) {
    console.error('YouTube video detayları alınırken hata:', error);
    return null;
  }
}

/**
 * YouTube video URL'si oluşturur
 * @param videoId Video ID
 * @returns Video URL'si
 */
export function getVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * YouTube embed URL'si oluşturur
 * @param videoId Video ID
 * @returns Embed URL'si
 */
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * YouTube embed URL'si oluşturur (alternatif isim)
 * @param videoId Video ID
 * @returns Embed URL'si
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return getEmbedUrl(videoId);
}

/**
 * İlgili videoları getirir
 * @param videoId Video ID
 * @param maxResults Maksimum sonuç sayısı
 * @returns İlgili videolar
 */
export async function getRelatedVideos(videoId: string, maxResults: number = 10): Promise<YoutubeSearchResult[]> {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      relatedToVideoId: videoId,
      type: 'video',
      maxResults: maxResults.toString(),
      key: API_KEY,
    });
    const response = await fetch(`${API_URL}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.info('İlgili videolar bulunamadı.');
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    }));
  } catch (error) {
    console.error('İlgili videolar alınırken hata:', error);
    return [];
  }
}
