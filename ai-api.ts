/**
 * AI API
 * 
 * Bu modül, AI Engine ile kullanıcı arayüzü arasında bir köprü görevi görür.
 * Tüm AI işlevlerini arayüzden erişilebilir hale getirir.
 */

import { AIEngine, AIResponse, AIQueryOptions } from './ai-engine';
import { MoodType } from './context/mood-detector';
import { ConversationMemory } from './context/conversation-memory';
import { Song } from '@shared/schema';
import { searchYouTube, YoutubeSearchResult, getVideoDetails } from '../youtube-api';
import * as LastfmAPI from '../lastfm-api';


// Singleton örnekler
let aiEngineInstance: AIEngine | null = null;
let conversationMemoryInstance: ConversationMemory | null = null;

/**
 * AI Engine örneğini döndürür (yoksa oluşturur)
 * @returns AI Engine örneği
 */
export function getAIEngine(): AIEngine {
  if (!aiEngineInstance) {
    aiEngineInstance = new AIEngine();
  }
  return aiEngineInstance;
}

/**
 * Konuşma Hafızası örneğini döndürür (yoksa oluşturur)
 * @returns Konuşma Hafızası örneği
 */
export function getConversationMemory(): ConversationMemory {
  if (!conversationMemoryInstance) {
    conversationMemoryInstance = new ConversationMemory();
  }
  return conversationMemoryInstance;
}

/**
 * Kullanıcı mesajını işler ve AI yanıtı döndürür
 * @param userId Kullanıcı ID'si
 * @param message Kullanıcı mesajı
 * @param options Sorgu seçenekleri
 * @returns AI yanıtı
 */
export async function processUserMessage(
  userId: string,
  message: string,
  options?: AIQueryOptions
): Promise<AIResponse> {
  const aiEngine = getAIEngine();
  return await aiEngine.processQuery(userId, message, options);
}

/**
 * Bir şarkı çalma isteğini işler
 * @param userId Kullanıcı ID'si
 * @param songId Şarkı ID'si veya başlığı
 * @param artist Sanatçı adı (opsiyonel)
 * @returns AI yanıtı
 */
export async function playMusic(
  userId: string,
  songId: string,
  artist?: string
): Promise<AIResponse> {
  const aiEngine = getAIEngine();
  
  // Şarkı çalma isteği oluştur
  let message = `${songId} şarkısını çal`;
  
  if (artist) {
    message = `${artist}'ın ${songId} şarkısını çal`;
  }
  
  // Şarkı çalma niyetini belirterek sorguyu işle
  return await aiEngine.processQuery(userId, message, {
    useContext: true,
    returnSongs: true,
    maxResults: 1
  });
}

/**
 * Bir ruh haline göre müzik önerileri alır
 * @param userId Kullanıcı ID'si
 * @param mood Ruh hali
 * @param limit Sonuç sayısı
 * @returns AI yanıtı
 */
export async function getMoodRecommendations(
  userId: string,
  mood: string,
  limit: number = 10
): Promise<AIResponse> {
  const aiEngine = getAIEngine();
  
  // Doğrudan mood detector kullanmak daha verimli olabilir
  // Fakat burada kullanıcı dilinde doğal mesaj oluşturuyoruz
  const message = `${mood} hissediyorum, bana uygun müzik öner`;
  
  return await aiEngine.processQuery(userId, message, {
    useContext: true,
    returnSongs: true,
    maxResults: limit
  });
}

/**
 * Şarkı aramak için doğrudan fonksiyon
 * @param query Arama sorgusu
 * @param limit Sonuç sayısı
 * @returns AI yanıtı formatında arama sonuçları
 */
export async function searchSongs(
  query: string,
  limit: number = 10
): Promise<AIResponse> {
  try {
    const youtubeResults: YoutubeSearchResult[] = await searchYouTube(query, limit);

    const songs: Song[] = youtubeResults.map(item => {
      // Basic artist/title parsing from YouTube title
      let artist = item.channelTitle || 'Unknown Artist';
      let title = item.title;
      const titleParts = item.title.split(' - ');
      if (titleParts.length >= 2) {
        artist = titleParts[0].trim();
        title = titleParts.slice(1).join(' - ').trim();
      }
      // Remove common video suffixes like (Official Video), [Lyrics] etc.
      title = title.replace(/\s*\(Official Video\)|\s*\[Official Video\]|\s*\(Lyrics\)|\s*\[Lyrics\]|\s*\(Audio\)|\s*\[Audio\]/gi, '').trim();

      return {
        id: item.videoId, // Use youtube videoId as the primary ID for the song object in this context
        title: title,
        artist: artist,
        album: '', // YouTube API doesn't directly provide album for a general search result
        year: item.publishedAt ? new Date(item.publishedAt).getFullYear() : undefined,
        duration: 0, // YouTube API search results don't provide duration directly
        genre: [], // YouTube API doesn't provide genre tags directly
        mood: [],
        imageUrl: item.thumbnailUrl,
        source: 'youtube',
        youtubeId: item.videoId,
        // Fill other Song properties as available or with defaults
        createdAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
        updatedAt: new Date(),
        popularity: 0, // Popularity metrics like view count are not directly on YoutubeSearchResult, would need getVideoDetails
        releaseDate: item.publishedAt ? new Date(item.publishedAt).toISOString() : undefined
      };
    });

    return {
      text: `"${query}" için YouTube'da ${songs.length} sonuç bulundu.`,
      songs: songs,
      confidence: 0.9, // Confidence might be slightly lower as it's a direct API mapping
      intentDetected: "searchSong"
    };
  } catch (error) {
    console.error('YouTube arama hatası (searchSongs):', error);
    return {
      text: `Üzgünüm, "${query}" araması sırasında bir YouTube hatası oluştu.`,
      songs: [],
      confidence: 0.5,
      intentDetected: "error"
    };
  }
}

/**
 * Bir sanatçıya benzer müzik önerileri alır
 * @param userId Kullanıcı ID'si
 * @param artist Sanatçı adı
 * @param limit Sonuç sayısı
 * @returns AI yanıtı
 */
export async function getArtistRecommendations(
  userId: string,
  artist: string,
  limit: number = 5
): Promise<AIResponse> {
  const aiEngine = getAIEngine();
  const message = `${artist} gibi sanatçılar öner`;
  
  return await aiEngine.processQuery(userId, message, {
    useContext: true,
    returnArtists: true,
    maxResults: limit
  });
}

/**
 * Kullanıcıya özel kişiselleştirilmiş müzik önerileri alır
 * @param userId Kullanıcı ID'si
 * @param limit Sonuç sayısı
 * @returns AI yanıtı
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 10
): Promise<AIResponse> {
  const aiEngine = getAIEngine();
  
  // AI Engine'in doğrudan kişiselleştirilmiş öneri metodunu kullan
  const songs = await aiEngine.generatePersonalizedRecommendations(userId, limit);
  
  // Manuel yanıt oluştur
  const response: AIResponse = {
    text: "İşte sizin için önerilen şarkılar!",
    songs,
    confidence: 0.9,
    intentDetected: "recommendSong",
    entities: { personalizedRecommendation: true }
  };
  
  // Konuşma hafızasına ekle
  const conversationMemory = getConversationMemory();
  await conversationMemory.addSystemResponse(userId, response.text, {
    songs: songs.map(s => s.id),
    personalizedRecommendation: true
  });
  
  return response;
}

/**
 * Bir şarkıyı beğendiğini veya beğenmediğini bildirir
 * @param userId Kullanıcı ID'si
 * @param songId Şarkı ID'si
 * @param liked Beğenildi mi?
 * @returns Başarı durumu
 */
export async function rateSong(
  userId: string,
  songId: string, // Assume this is a YouTube Video ID
  liked: boolean
): Promise<boolean> {
  try {
    const aiEngine = getAIEngine();
    const conversationMemory = getConversationMemory();
    let songTitleForLog = songId; // Fallback title
    let songForProfile: Partial<Song> = { id: songId, title: songId };

    try {
      const videoDetails = await getVideoDetails(songId);
      if (videoDetails) {
        songTitleForLog = videoDetails.title;
        let artistName = videoDetails.channelTitle;
        let trackTitle = videoDetails.title;
        const titleParts = videoDetails.title.split(' - ');
        if (titleParts.length >= 2) {
          artistName = titleParts[0].trim();
          trackTitle = titleParts.slice(1).join(' - ').trim();
        }
        trackTitle = trackTitle.replace(/\s*\(Official Video\)|\s*\[Official Video\]|\s*\(Lyrics\)|\s*\[Lyrics\]|\s*\(Audio\)|\s*\[Audio\]/gi, '').trim();

        songForProfile = {
          id: songId,
          title: trackTitle,
          artist: artistName,
          youtubeId: songId,
          imageUrl: videoDetails.thumbnailUrl,
          source: 'youtube',
          album: undefined,
          year: videoDetails.publishedAt ? new Date(videoDetails.publishedAt).getFullYear() : undefined,
          duration: 0,
          genre: [],
          moods: [],
          createdAt: videoDetails.publishedAt ? new Date(videoDetails.publishedAt) : new Date(),
          updatedAt: new Date(),
          popularity: 0,
          releaseDate: videoDetails.publishedAt ? new Date(videoDetails.publishedAt).toISOString() : undefined,
        };
        songTitleForLog = `${artistName} - ${trackTitle}`;

        // Optionally, try to enrich with Last.fm data
        const lastfmInfo = await LastfmAPI.getTrackInfo(artistName, trackTitle);
        if (lastfmInfo) {
          songForProfile.album = lastfmInfo.album || songForProfile.album; // Assuming lastfmInfo.album is string or undefined, verify with LastfmTrack type
          songForProfile.genre = (lastfmInfo as any).toptags?.tag?.map((t: { name: string }) => t.name) || songForProfile.genre; // Temporary: Verify LastfmTrack for toptags
          songForProfile.duration = lastfmInfo.duration ? (lastfmInfo.duration * 1000) : (songForProfile.duration || 0);
          // songForProfile.imageUrl = lastfmInfo.imageUrl || songForProfile.imageUrl; 
        }
      } else {
        console.warn(`rateSong: YouTube video details not found for ID: ${songId}. Using ID as title.`);
      }
    } catch (detailsError) {
      console.error(`rateSong: Error fetching details for songId ${songId}:`, detailsError);
      // Proceed with songId as title if details fail
    }

    const actionText = liked
      ? `"${songTitleForLog}" şarkısını beğendi`
      : `"${songTitleForLog}" şarkısını beğenmedi`;

    await conversationMemory.addUserAction(userId, actionText, {
      songId,
      action: liked ? 'like' : 'dislike'
    });

    const userProfiles = (aiEngine as any).userProfiles;
    if (userProfiles && userProfiles.has(userId)) {
      const userProfile = userProfiles.get(userId);
      // Ensure songForProfile has enough data for logLikeDislike or adapt logLikeDislike
      if (songForProfile.title && songForProfile.artist) { // Basic check
        await userProfile.logLikeDislike(songForProfile as Song, liked); 
      } else {
        console.warn(`rateSong: Insufficient song data for profile update on songId: ${songId}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Şarkı değerlendirme hatası:', error);
    return false;
  }
}
/**
 * Müzik veya sanatçı araması yapar
 * @param userId Kullanıcı ID'si
 * @param query Arama sorgusu
 * @param limit Sonuç sayısı
 * @returns AI yanıtı
 */
export async function searchMusic(
  userId: string,
  query: string,
  limit: number = 10
): Promise<AIResponse> {
  const aiEngine = getAIEngine();
  const message = `${query} ara`;
  
  return await aiEngine.processQuery(userId, message, {
    useContext: true,
    returnSongs: true,
    returnArtists: true,
    maxResults: limit
  });
}

/**
 * AI yanıtındaki önerilen eylemleri işler
 * @param userId Kullanıcı ID'si
 * @param action Önerilen eylem
 * @returns İşlem sonucu
 */
export async function processSuggestedAction(
  userId: string,
  action: { action: string; text: string; data?: any }
): Promise<any> {
  // Bu fonksiyon, arayüzde AI eylemlerini işlemek için bir temel sağlar
  const conversationMemory = getConversationMemory();
  
  try {
    // Kullanıcı eylemini konuşma hafızasına kaydet
    await conversationMemory.addUserAction(userId, `"${action.text}" eylemini seçti`, {
      actionType: action.action,
      actionData: action.data
    });
    
    switch (action.action) {
      case 'play':
        // Şarkı çalma
        if (action.data && action.data.songId) {
          return await playMusic(userId, action.data.songId, action.data.artist);
        }
        return null;
        
      case 'search':
        // Arama
        if (action.data && action.data.query) {
          return await searchMusic(userId, action.data.query);
        }
        return null;
        
      case 'recommend':
        // Öneriler
        if (action.data && action.data.mood) {
          return await getMoodRecommendations(userId, action.data.mood);
        } else if (action.data && action.data.artist) {
          return await getArtistRecommendations(userId, action.data.artist);
        } else {
          return await getPersonalizedRecommendations(userId);
        }
        
      case 'info':
        // Bilgi alma
        if (action.data && action.data.artist) {
          return await searchMusic(userId, action.data.artist, 1);
        }
        return null;
        
      default:
        console.log('İşlenen eylem:', action);
        return action.data;
    }
  } catch (error) {
    console.error('Eylem işleme hatası:', error);
    return null;
  }
}

/**
 * Kullanıcı verilerini analiz eder ve içgörüler sağlar
 * @param userId Kullanıcı ID'si
 * @returns Kullanıcı içgörüleri
 */
export async function getUserInsights(userId: string): Promise<Record<string, any>> {
  const aiEngine = getAIEngine();
  
  try {
    // AI Engine'in dahili bileşenlerine erişim
    const userProfiles = (aiEngine as any).userProfiles;
    
    if (!userProfiles || !userProfiles.has(userId)) {
      // Profil yüklenmemiş, yükleyelim
      await aiEngine.processQuery(userId, "profil bilgilerimi göster");
    }
    
    if (userProfiles && userProfiles.has(userId)) {
      const userProfile = userProfiles.get(userId);
      
      // Haftalık özet oluştur
      const weeklySummary = await aiEngine.generateWeeklySummary(userId);
      
      return {
        topGenres: userProfile.getTopGenres(),
        topArtists: userProfile.getTopArtists(),
        topMoods: userProfile.getTopMoods(),
        summary: userProfile.getSummary(),
        weeklySummary
      };
    }
    
    return {
      error: 'Kullanıcı profili bulunamadı'
    };
  } catch (error) {
    console.error('Kullanıcı içgörüleri hatası:', error);
    
    return {
      error: 'Kullanıcı içgörüleri alınamadı'
    };
  }
}

/**
 * Belirli bir şarkının ruh halini tespit eder
 * @param songId Şarkı ID'si
 * @returns Ruh hali tespiti sonucu
 */
export async function detectSongMood(songId: string): Promise<any> {
  const aiEngine = getAIEngine();
  
  try {
    // AI Engine'in moodDetector bileşenine erişim
    const moodDetector = (aiEngine as any).moodDetector;
    
    if (moodDetector) {
      return await moodDetector.detectMood(songId);
    }
    
    return {
      error: 'Ruh hali tespit bileşeni bulunamadı'
    };
  } catch (error) {
    console.error('Ruh hali tespiti hatası:', error);
    
    return {
      error: 'Ruh hali tespit edilemedi'
    };
  }
}

/**
 * Bir ruh haline göre şarkı önerileri alır
 * @param mood Ruh hali
 * @param limit Sonuç sayısı
 * @returns Şarkı listesi
 */
export async function getSongsByMood(mood: MoodType, limit: number = 10): Promise<Song[]> {
  const aiEngine = getAIEngine();
  
  try {
    // AI Engine'in moodDetector bileşenine erişim
    const moodDetector = (aiEngine as any).moodDetector;
    
    if (moodDetector) {
      return await moodDetector.findSongsByMood(mood, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Ruh haline göre şarkı önerisi hatası:', error);
    return [];
  }
}

/**
 * Kullanıcının konuşma geçmişini getirir
 * @param userId Kullanıcı ID'si
 * @param limit Alınacak mesaj sayısı
 * @returns Konuşma geçmişi
 */
export async function getConversationHistory(userId: string, limit: number = 10): Promise<any[]> {
  const conversationMemory = getConversationMemory();
  
  try {
    return await conversationMemory.getConversationHistory(userId, limit);
  } catch (error) {
    console.error('Konuşma geçmişi hatası:', error);
    return [];
  }
}

/**
 * Kullanıcı bağlamını getirir
 * @param userId Kullanıcı ID'si
 * @returns Kullanıcı bağlamı
 */
export async function getUserContext(userId: string): Promise<any> {
  const conversationMemory = getConversationMemory();
  
  try {
    return await conversationMemory.getContext(userId);
  } catch (error) {
    console.error('Kullanıcı bağlamı hatası:', error);
    return {};
  }
}
