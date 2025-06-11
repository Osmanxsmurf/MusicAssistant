/**
 * Hibrit Müzik API Servisi
 * 
 * Bu modül, Last.fm ve YouTube API'lerini birleştirerek daha zengin bir müzik deneyimi sunar.
 * Last.fm'den müzik meta verilerini (tür, sanatçı bilgileri, popülerlik) alırken,
 * YouTube'dan oynatma içeriği ve görsel içerik (thumbnail) alır.
 */

import { Song } from '@shared/schema';
import { searchYouTube, YoutubeSearchResult } from './youtube-api';
export { searchYouTube }; // searchYouTube'u yeniden export et
import { 
  getTrackInfo, 
  getSimilarTracks, 
  getTopTracks, 
  getTopTracksByTag, 
  LastfmTrack 
} from './lastfm-api';
import { searchTracksSpotify, SpotifyTrack } from './spotify-api'; // searchTracksSpotify eklendi, Added SpotifyTrack import

/**
 * Last.fm track bilgisini Song objesine dönüştürür
 * @param track Last.fm'den gelen track bilgisi
 * @returns Song formatında veri
 */
export function mapLastfmTrackToSong(track: LastfmTrack): Partial<Song> {
  return {
    title: track.name || 'Bilinmeyen Şarkı',
    artist: track.artist || 'Bilinmeyen Sanatçı',
    album: track.album || 'Bilinmeyen Albüm',
    imageUrl: track.imageUrl || 'https://via.placeholder.com/150',
    popularity: track.listeners || 50, // Assuming 0 listeners means default popularity
    genre: track.tags || [],
    // releaseDate is not typically part of LastfmTrack, will be handled by YouTube or default
    // releaseDate: new Date().toISOString().split('T')[0], // Keep if a default is always needed
  };
}

/**
 * YouTube sonucunu Song objesine dönüştürür
 * @param result YouTube arama sonucu
 * @returns Song formatında veri
 */
export function mapYouTubeResultToSong(result: YoutubeSearchResult): Song {
  let artist = 'Bilinmeyen Sanatçı';
  let title = result.title;
  
  // Başlığı parçala (Sanatçı - Şarkı formatında ise)
  const titleParts = result.title.split(' - ');
  if (titleParts.length > 1) {
    artist = titleParts[0].trim();
    title = titleParts.slice(1).join(' - ').trim();
  }
  
  return {
    id: result.videoId,
    title: title,
    artist: artist,
    album: 'YouTube',
    duration: 0, // YouTube API duration'ı direkt vermiyor
    genre: [],
    moods: [],
    imageUrl: result.thumbnailUrl,
    youtubeId: result.videoId,
    createdAt: new Date(),
    updatedAt: new Date(),
    popularity: 50,
    releaseDate: result.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
  };
}

/**
 * Last.fm ve YouTube'u kullanarak zenginleştirilmiş şarkı verileri getirir
 * @param query Arama sorgusu
 * @param limit Sonuç limiti
 * @returns Zenginleştirilmiş şarkı listesi
 */
export async function getEnrichedSongs(
  query: string, 
  limit: number = 10, 
  spotifyAccessToken?: string // Yeni parametre
): Promise<Song[]> {
  try {
    // 1. Spotify ile arama yapmayı dene (eğer token varsa)
    if (spotifyAccessToken && query) {
      console.log(`Spotify'da aranıyor: "${query}"`);
      const spotifyTracks = await searchTracksSpotify(query, spotifyAccessToken, limit);
      if (spotifyTracks && spotifyTracks.length > 0) {
        console.log(`${spotifyTracks.length} sonuç Spotify'dan bulundu.`);
        const songs = spotifyTracks.map(mapSpotifyTrackToSong);
        return songs;
      }
      console.log(`Spotify'da "${query}" için sonuç bulunamadı veya token geçersiz.`);
    }

    // 2. Spotify'dan sonuç yoksa veya token yoksa, mevcut Last.fm/YouTube mantığına geç
    // searchTrack kaldırıldığı için, Last.fm'den şarkı arama yerine getTopTracksByTag veya getTopTracks kullanılabilir.
    // Şimdilik, genel bir YouTube araması yapalım ve bunu Last.fm ile zenginleştirmeye çalışalım.
    // VEYA doğrudan YouTube sonuçlarını döndürelim.
    // TODO: Daha iyi bir Last.fm arama entegrasyonu düşünülmeli.
    console.warn('getEnrichedSongs: searchTrack kaldırıldı, geçici olarak YouTube kullanılıyor.');
    const youtubeSongs = await getSongsFromYouTube(query, limit);
    
    // YouTube sonuçlarını Last.fm ile zenginleştirmeye çalışalım (opsiyonel)
    const enrichedSongs = await Promise.all(
      youtubeSongs.map(async (ytSong) => {
        try {
          const trackInfo = await getTrackInfo(ytSong.artist!, ytSong.title!);
          if (trackInfo) {
            const lastfmData = mapLastfmTrackToSong(trackInfo);
            return {
              ...ytSong,
              album: lastfmData.album || ytSong.album,
              genre: lastfmData.genre || ytSong.genre,
              popularity: lastfmData.popularity || ytSong.popularity,
              releaseDate: lastfmData.releaseDate || ytSong.releaseDate,
              // imageUrl Lastfm'den de gelebilir, YouTube'dan gelen daha iyi olabilir.
            } as Song;
          }
        } catch (e) {
          // console.error('Last.fm enrichment failed for', ytSong.title, e);
        }
        return ytSong; // Zenginleştirilemezse YouTube şarkısını döndür
      })
    );
    return enrichedSongs;
  } catch (error) {
    console.error('Error getting enriched songs:', error);
    return getSongsFromYouTube(query, limit); // Hata durumunda sadece YouTube'dan al
  }
}

/**
 * Sadece YouTube kullanarak şarkı verileri getirir
 * @param query Arama sorgusu
 * @param limit Sonuç limiti
 * @returns YouTube'dan alınan şarkı listesi
 */
export async function getSongsFromYouTube(query: string, limit: number = 10): Promise<Song[]> {
  try {
    const results = await searchYouTube(query, limit);
    return results.map(mapYouTubeResultToSong);
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

/**
 * Tür, ruh hali veya sanatçıya göre popüler şarkıları getirir
 * @param options Filtreleme seçenekleri
 * @param limit Sonuç limiti
 * @returns Popüler şarkılar listesi
 */
export async function getPopularSongs({ 
  genre, 
  mood, 
  artist 
}: { 
  genre?: string, 
  mood?: string, 
  artist?: string 
}, limit: number = 10): Promise<Song[]> {
  try {
    let lastfmTracks: LastfmTrack[] = [];
    let effectiveSearchQuery = '';

    if (genre) {
      lastfmTracks = await getTopTracksByTag(genre, limit);
      effectiveSearchQuery = `${genre} popular songs`;
    } else if (mood) {
      // Last.fm doesn't directly support mood-based track fetching like genre.
      // We can try to get top tracks by a tag that might represent the mood,
      // or fall back to a YouTube search with the mood.
      // For now, let's assume mood can be a tag for Last.fm or use it for YouTube search.
      lastfmTracks = await getTopTracksByTag(mood, limit); 
      effectiveSearchQuery = `${mood} music`;
    } else if (artist) {
      // For artist, we can fetch their top tracks. Last.fm API has artist.getTopTracks.
      // Since our lastfm-api.ts doesn't have it, we'll try to enrich YouTube results.
      // Or, we can use getArtistInfo and then use similar artists if needed.
      // For simplicity now, directly search YouTube and enrich.
      effectiveSearchQuery = `${artist} top tracks`;
      const artistSongs = await getSongsFromYouTube(effectiveSearchQuery, limit);
      return Promise.all(
        artistSongs.map(async (ytSong) => {
          try {
            const trackInfo = await getTrackInfo(ytSong.artist!, ytSong.title!);
            if (trackInfo) {
              const lastfmData = mapLastfmTrackToSong(trackInfo);
              return { ...ytSong, ...lastfmData, mood: mood ? [mood] : [], genre: genre ? [genre] : [] } as Song;
            }
          } catch (e) { /* ignore enrichment error */ }
          return { ...ytSong, mood: mood ? [mood] : [], genre: genre ? [genre] : [] } as Song;
        })
      );
    } else {
      // No specific filter, get general top tracks from Last.fm
      lastfmTracks = await getTopTracks(limit);
      effectiveSearchQuery = 'top hits';
    }

    if (lastfmTracks && lastfmTracks.length > 0) {
      // We have tracks from Last.fm, enrich them with YouTube data
      const enrichedSongs = await Promise.all(
        lastfmTracks.slice(0, limit).map(async (track: LastfmTrack) => {
          const basicSong = mapLastfmTrackToSong(track);
          const ytQuery = `${basicSong.artist} ${basicSong.title}`;
          try {
            const youtubeResults = await searchYouTube(ytQuery, 1);
            if (youtubeResults.length > 0) {
              return {
                id: youtubeResults[0].videoId,
                youtubeId: youtubeResults[0].videoId,
                imageUrl: youtubeResults[0].thumbnailUrl || basicSong.imageUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
                duration: 0, // Or try to get from YouTube if possible later
                moods: mood ? [mood] : (basicSong.moods || []),
                genre: genre ? [genre] : (basicSong.genre || []),
                ...basicSong
              } as Song;
            }
          } catch (error) {
            console.error(`YouTube enrichment error for "${ytQuery}":`, error);
          }
          // Fallback if YouTube enrichment fails
          return {
            id: `lastfm_${track.name.replace(/\s+/g, '_')}_${track.artist.replace(/\s+/g, '_')}`,
            youtubeId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            duration: basicSong.duration || 0,
            moods: mood ? [mood] : (basicSong.moods || []),
            genre: genre ? [genre] : (basicSong.genre || []),
            ...basicSong
          } as Song;
        })
      );
      return enrichedSongs;
    }
    
    // If Last.fm provided no tracks or an error occurred before this point for genre/mood based search,
    // fall back to a YouTube search based on the effectiveSearchQuery.
    // The 'artist' case already returns early if successful.
    if (!artist) { // Only fallback if not an artist search (which has its own return)
        console.warn(`No Last.fm tracks for query, falling back to YouTube with: ${effectiveSearchQuery}`);
        return getSongsFromYouTube(effectiveSearchQuery, limit);
    }
    
    // If it was an artist search that somehow didn't return and didn't error before,
    // this is an unlikely path, but as a final fallback:
    return getSongsFromYouTube(artist || genre || mood || 'popular music', limit);

  } catch (error) {
    console.error('Error in getPopularSongs:', error);
    // Generic fallback in case of any unexpected error in the main try block
    const fallbackQuery = artist || genre || mood || 'popular music';
    console.error(`Critical error in getPopularSongs, falling back to YouTube with: ${fallbackQuery}`);
    return getSongsFromYouTube(fallbackQuery, limit);
  }
}

/**
 * En popüler şarkıları getirir
 * @param limit Sonuç limiti
 * @returns Popüler şarkılar listesi
 */

export function mapSpotifyTrackToSong(spotifyTrack: SpotifyTrack): Song {
  const artists = spotifyTrack.artists.map(artist => artist.name);
  const artistSpotifyIds = spotifyTrack.artists.map(artist => artist.id);

  let imageUrl: string | undefined = undefined;
  if (spotifyTrack.album?.images && spotifyTrack.album.images.length > 0) {
    imageUrl = spotifyTrack.album.images[0].url;
  }

  return {
    id: spotifyTrack.id, 
    title: spotifyTrack.name,
    artist: artists.join(', '), 
    album: spotifyTrack.album?.name,
    duration: spotifyTrack.duration_ms ? Math.round(spotifyTrack.duration_ms / 1000) : undefined,
    year: spotifyTrack.album?.release_date ? parseInt(spotifyTrack.album.release_date.substring(0, 4)) : undefined,
    releaseDate: spotifyTrack.album?.release_date,
    imageUrl: imageUrl,
    coverImage: imageUrl, 
    popularity: spotifyTrack.popularity,
    source: 'spotify',
    spotifyId: spotifyTrack.id,
    spotifyUrl: spotifyTrack.external_urls?.spotify,
    previewUrl: spotifyTrack.preview_url,
    albumSpotifyId: spotifyTrack.album?.id,
    artistSpotifyIds: artistSpotifyIds,
    genre: [], 
    moods: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getTopSongs(limit: number = 10): Promise<Song[]> {
  try {
    // Last.fm'den en popüler şarkıları al
    const lastfmTracks = await getTopTracks(limit);
    
    if (lastfmTracks && lastfmTracks.length > 0) {
      // YouTube ile zenginleştir
      const enrichedSongs = await Promise.all(
        lastfmTracks.slice(0, limit).map(async (track: LastfmTrack) => {
          const basicSong = mapLastfmTrackToSong(track);
          const searchQuery = `${basicSong.artist} ${basicSong.title}`;
          
          try {
            const youtubeResults = await searchYouTube(searchQuery, 1);
            
            if (youtubeResults.length > 0) {
              return {
                id: youtubeResults[0].videoId,
                youtubeId: youtubeResults[0].videoId,
                imageUrl: youtubeResults[0].thumbnailUrl || basicSong.imageUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
                duration: 0,
                moods: [],
                ...basicSong
              } as Song;
            }
          } catch (error) {
            console.error(`YouTube enrichment error for "${searchQuery}":`, error);
          }
          
          return {
            id: `lastfm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            youtubeId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            duration: 0,
            moods: [],
            ...basicSong
          } as Song;
        })
      );
      
      return enrichedSongs;
    }
    
    // Last.fm'den sonuç alınamazsa YouTube'u kullan
    return getSongsFromYouTube('popular music', limit);
  } catch (error) {
    console.error('Error getting top songs:', error);
    return getSongsFromYouTube('popular music', limit);
  }
}

/**
 * Belirli bir ruh haline göre şarkı önerileri getirir
 * @param mood Ruh hali
 * @param limit Sonuç limiti
 * @returns Ruh haline uygun şarkılar
 */
export async function getMoodBasedSongs(mood: string, limit: number = 10): Promise<Song[]> {
  // Türkçe ruh halleri için İngilizce karşılıkları
  const moodTranslations: Record<string, string> = {
    'mutlu': 'happy',
    'hüzünlü': 'sad',
    'enerjik': 'energetic',
    'sakin': 'calm',
    'romantik': 'romantic',
    'öfkeli': 'angry',
    'nostaljik': 'nostalgic',
    'melankolik': 'melancholic',
    'odaklanma': 'focus'
  };
  
  // Türkçe ruh halinin İngilizce karşılığını bul (varsa)
  const englishMood = moodTranslations[mood.toLowerCase()] || mood;
  
  // Last.fm tag'leri için ruh halini kullan
  return getPopularSongs({ mood: englishMood }, limit);
}

/**
 * Şarkı ID'sine göre detaylı bilgi getirir
 * @param songId Şarkı ID'si
 * @returns Şarkı detayları
 */
export async function getSongDetails(songId: string): Promise<Song | null> {
  // YouTube video ID'si ise
  if (songId.length === 11) {
    try {
      // YouTube'dan video detaylarını al
      // searchYouTube'un üçüncü parametresi (getExactMatch) kaldırılmış olabilir, kontrol et.
      // Şimdilik true olmadan çağırıyorum.
      const results = await searchYouTube(songId, 1); // getExactMatch parametresi kaldırıldı varsayımı
      
      if (results.length > 0) {
        const song = mapYouTubeResultToSong(results[0]);
        
        // Last.fm'den ek bilgiler almaya çalış
        try {
          const trackInfo = await getTrackInfo(song.artist, song.title);
          
          if (trackInfo) { // trackInfo is LastfmTrack | null, so if not null, it's LastfmTrack
            // Last.fm bilgilerini birleştir
            const lastfmData = mapLastfmTrackToSong(trackInfo);
            
            return {
              ...song,
              album: lastfmData.album || song.album,
              genre: lastfmData.genre || song.genre,
              popularity: lastfmData.popularity || song.popularity,
              releaseDate: lastfmData.releaseDate || song.releaseDate
            };
          }
        } catch (lastfmError) {
          console.error('Last.fm track info error:', lastfmError);
        }
        
        return song;
      }
    } catch (error) {
      console.error('YouTube video details error:', error);
    }
  } else if (songId.startsWith('lastfm_')) {
    // Last.fm ID'si ise, localStorage'dan bilgileri almaya çalış
    const localSongs = JSON.parse(localStorage.getItem('recent_songs') || '[]');
    const song = localSongs.find((s: Song) => s.id === songId);
    
    if (song) {
      return song;
    }
  }
  
  return null;
}

/**
 * Benzer şarkıları getirir
 * @param song Referans şarkı
 * @param limit Sonuç limiti
 * @returns Benzer şarkılar listesi
 */
export async function getSimilarSongs(song: Song, limit: number = 10): Promise<Song[]> {
  try {
    // Last.fm'den benzer şarkıları almaya çalış
    const similarLastfmTracks = await getSimilarTracks(song.artist!, song.title!, limit);

    if (similarLastfmTracks && similarLastfmTracks.length > 0) {
      const tracksToEnrich = similarLastfmTracks;
        // Benzer şarkıları YouTube ile zenginleştir
        const enrichedSongs = await Promise.all(
          tracksToEnrich.map(async (track: LastfmTrack) => {
            const basicSong = mapLastfmTrackToSong(track);
            const searchQuery = `${basicSong.artist} ${basicSong.title}`;
            
            try {
              const youtubeResults = await searchYouTube(searchQuery, 1);
              
              if (youtubeResults.length > 0) {
                return {
                  id: youtubeResults[0].videoId,
                  youtubeId: youtubeResults[0].videoId,
                  imageUrl: youtubeResults[0].thumbnailUrl || basicSong.imageUrl,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  duration: 0,
                  moods: song.moods,
                  ...basicSong
                } as Song;
              }
            } catch (error) {
              console.error(`YouTube enrichment error for "${searchQuery}":`, error);
            }
            
            return {
              id: `lastfm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              youtubeId: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              duration: 0,
              moods: song.moods,
              ...basicSong
            } as Song;
          })
        );
        
        return enrichedSongs;
      }
    // Fallback if Last.fm had no similar tracks (or if the if-block was not entered)
    const searchQuery = `${song.artist} ${song.genre?.[0] || ''} similar`;
    return getSongsFromYouTube(searchQuery, limit);

  } catch (error) {
    console.error('Error getting similar songs:', error);
    
    // Hata durumunda sanatçı bazlı bir arama yap
    const searchQuery = `${song.artist} similar`;
    return getSongsFromYouTube(searchQuery, limit);
  }
}

/**
 * Şarkı sözlerini getirir (placeholder).
 * @param title Şarkı adı
 * @param artist Sanatçı adı
 * @returns Şarkı sözleri veya null
 */
export async function getLyrics(title: string, artist: string): Promise<string | null> {
  console.log(`Şarkı sözleri isteniyor: ${title} - ${artist}. Henüz implemente edilmedi.`);
  // TODO: Gerçek şarkı sözü API entegrasyonu eklenecek
  return null;
}
