// client/src/lib/ai/assistant.ts
import {
  getArtistTopTracks,
  getTodaysTopHits,
  searchArtists,
  getRecommendationsSpotify, // getRecommendationsSpotify olarak güncellendi
  SpotifyTrack,
  RecommendationParams, // RecommendationParams eklendi
} from '../spotify-api';

export type UserIntent =
  | 'get_artist_top_tracks'
  | 'get_todays_top_hits'
  | 'get_mood_genre_recommendation'
  | 'play_song' // Gelecekte eklenecek
  | 'unknown';

export interface ExtractedEntities {
  artistName?: string;
  trackCount?: number;
  mood?: string;
  genre?: string;
  songName?: string; // Gelecekte eklenecek
}

// Kullanılabilecek ruh halleri ve türler (genişletilebilir)
export const AVAILABLE_MOODS = [
  'Mutlu', 'Hüzünlü', 'Enerjik', 'Sakin', 'Romantik', 'Parti', 'Odaklanma', 'Spor', 'Yolculuk'
];

export const TURKISH_MUSIC_GENRES = [
  { id: 'turkish_pop', name: 'Türkçe Pop' },
  { id: 'turkish_rock', name: 'Türkçe Rock' },
  { id: 'turkish_rap', name: 'Türkçe Rap' },
  { id: 'arabesk', name: 'Arabesk' },
  { id: 'turku', name: 'Türkü' },
  { id: 'karadeniz_turkuleri', name: 'Karadeniz Türküleri' },
  { id: 'ege_turkuleri', name: 'Ege Türküleri' },
  { id: 'thm', name: 'Türk Halk Müziği' },
  { id: 'tsm', name: 'Türk Sanat Müziği' },
  { id: 'protest_music', name: 'Özgün Müzik' },
  { id: 'anatolian_rock', name: 'Anadolu Rock' },
  { id: 'blues', name: 'Blues' }, // Genel türler
  { id: 'rock', name: 'Rock' },
  { id: 'jazz', name: 'Jazz' },
  { id: 'classical', name: 'Klasik Müzik' },
  // ... daha fazla eklenebilir
];

// Basit anahtar kelime tabanlı niyet tespiti
export function detectIntent(message: string): UserIntent {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('en sevilen') || lowerMessage.includes('en popüler') || lowerMessage.includes('top şarkı')) {
    return 'get_artist_top_tracks';
  }
  if (lowerMessage.includes('bugün ne dinlesem') || lowerMessage.includes('ne önerirsin') || lowerMessage.includes('popüler olanlardan')) {
    return 'get_todays_top_hits';
  }
  if (lowerMessage.includes('çal') || lowerMessage.includes('öner') || lowerMessage.includes('dinlemek istiyorum') ||
      lowerMessage.includes('türküleri') || lowerMessage.includes('müziği') || lowerMessage.includes('tarzı') ||
      AVAILABLE_MOODS.some(mood => lowerMessage.includes(mood.toLowerCase())) ||
      TURKISH_MUSIC_GENRES.some(genre => lowerMessage.includes(genre.name.toLowerCase()))) {
    return 'get_mood_genre_recommendation';
  }
  return 'unknown';
}

// Basit entity çıkarma
export function extractEntities(message: string, intent: UserIntent): ExtractedEntities {
  const entities: ExtractedEntities = {};
  const lowerMessage = message.toLowerCase();

  if (intent === 'get_artist_top_tracks') {
    const artistKeywords = ['en sevilen', 'en popüler', 'top şarkı'];
    let artistNameEndIndex = -1;
    for (const keyword of artistKeywords) {
      const keywordIndex = lowerMessage.indexOf(keyword);
      if (keywordIndex !== -1) {
        artistNameEndIndex = keywordIndex;
        break;
      }
    }
    if (artistNameEndIndex > 0) {
      entities.artistName = message.substring(0, artistNameEndIndex).trim();
    } else {
      const words = message.split(' ');
      if (words.length > 0) entities.artistName = words[0];
      if (words.length > 1 && !artistKeywords.some(kw => words[1].toLowerCase().includes(kw))) entities.artistName += ` ${words[1]}`;
      entities.artistName = entities.artistName?.replace(/['"]/g, '').trim(); // Tırnak işaretlerini temizle
    }

    const countMatch = lowerMessage.match(/(\d+)\s*(şarkı|tane)/);
    if (countMatch && countMatch[1]) {
      entities.trackCount = parseInt(countMatch[1], 10);
    } else {
      entities.trackCount = 3; // Varsayılan
    }
  } else if (intent === 'get_mood_genre_recommendation') {
    for (const mood of AVAILABLE_MOODS) {
      if (lowerMessage.includes(mood.toLowerCase())) {
        entities.mood = mood;
        break;
      }
    }
    if (!entities.mood) {
      for (const genre of TURKISH_MUSIC_GENRES) {
        if (lowerMessage.includes(genre.name.toLowerCase())) {
          entities.genre = genre.name;
          if (genre.name === "Karadeniz Türküleri" && lowerMessage.includes("karadeniz")) entities.genre = "Karadeniz Türküleri";
          if (genre.name === "Ege Türküleri" && (lowerMessage.includes("ege") || lowerMessage.includes("zeybek"))) entities.genre = "Ege Türküleri";
          break;
        }
      }
    }
    if (lowerMessage.includes('çiğköftelik')) {
        entities.genre = 'Çiğköftelik';
    }
  }
  return entities;
}

// Kullanıcıdan gelen isteği işleme
export async function handleUserRequest(
  message: string,
  accessToken: string
): Promise<string | SpotifyTrack[]> {
  const intent = detectIntent(message);
  const entities = extractEntities(message, intent);

  console.log("Intent:", intent, "Entities:", entities);

  switch (intent) {
    case 'get_artist_top_tracks':
      if (entities.artistName && accessToken) {
        try {
          const artists = await searchArtists(accessToken, entities.artistName, 1);
          if (artists.length > 0) {
            const artistId = artists[0].id;
            const tracks = await getArtistTopTracks(accessToken, artistId, entities.trackCount || 3, 'TR');
            if (tracks.length > 0) {
              return tracks;
            } else {
              return `${entities.artistName} için popüler şarkı bulunamadı.`;
            }
          } else {
            return `Sanatçı '${entities.artistName}' bulunamadı.`;
          }
        } catch (error) {
          console.error('Error fetching artist top tracks:', error);
          return 'Sanatçının şarkıları alınırken bir hata oluştu.';
        }
      }
      return 'Lütfen bir sanatçı adı belirtin. Örneğin: "Tarkan en sevilen 3 şarkısı"';

    case 'get_todays_top_hits':
      if (accessToken) {
        try {
          const tracks = await getTodaysTopHits(accessToken, '37i9dQZF1DXcBWIGoYBM5M', 3); // İlk 3 popüler şarkı
          if (tracks.length > 0) {
            return tracks;
          } else {
            return 'Bugünün popüler şarkıları bulunamadı.';
          }
        } catch (error) {
          console.error('Error fetching today\'s top hits:', error);
          return 'Popüler şarkılar alınırken bir hata oluştu.';
        }
      }
      return 'Popüler şarkıları almak için Spotify bağlantısı gerekli.';

    case 'get_mood_genre_recommendation':
      if (accessToken && (entities.mood || entities.genre)) {
        const params: RecommendationParams = { limit: 5, market: 'TR' };
        let userFeedback = "";

        if (entities.genre) {
          userFeedback = `${entities.genre} tarzında şarkılar aranıyor...`;
          switch (entities.genre) {
            case 'Türkçe Pop': params.seed_genres = ['turkish-pop', 'pop']; break;
            case 'Türkçe Rock': params.seed_genres = ['turkish-rock', 'anatolian-rock']; break;
            case 'Türkçe Rap': params.seed_genres = ['turkish-hip-hop', 'rap']; break;
            case 'Arabesk': params.seed_genres = ['arabesk']; break;
            case 'Türkü': case 'Türk Halk Müziği': params.seed_genres = ['turkish-folk']; break;
            case 'Karadeniz Türküleri': 
              params.seed_genres = ['turkish-folk']; 
              // İleride Karadenizli sanatçı ID'leri eklenebilir veya target_tempo gibi özellikler ayarlanabilir.
              userFeedback = "Karadeniz'in o eşsiz havasına uygun türküler geliyor!";
              break;
            case 'Ege Türküleri': 
              params.seed_genres = ['turkish-folk']; 
              params.target_danceability = 0.6; // Zeybek ve hareketli Ege türküleri için
              userFeedback = "Ege'nin mis gibi zeybekleri ve türküleri yolda!";
              break;
            case 'Türk Sanat Müziği': params.seed_genres = ['turkish-classical', 'classical']; break;
            case 'Çiğköftelik':
              params.seed_genres = ['turkish-folk', 'pop', 'arabesk']; // Geniş bir yelpaze
              params.target_energy = 0.8;
              params.target_danceability = 0.7;
              params.target_valence = 0.7;
              userFeedback = "Acılı çiğköftenin yanına gidecek en kral şarkılar hazırlanıyor!";
              break;
            default: params.seed_genres = [entities.genre.toLowerCase().replace(' ', '-')]; // Genel bir deneme
          }
        } else if (entities.mood) {
          userFeedback = `${entities.mood} ruh haline uygun şarkılar aranıyor...`;
          switch (entities.mood) {
            case 'Mutlu': params.target_valence = 0.8; params.target_energy = 0.7; break;
            case 'Hüzünlü': params.target_valence = 0.2; params.target_mode = 0; break; // Minor mod
            case 'Enerjik': params.target_energy = 0.9; params.target_danceability = 0.8; break;
            case 'Sakin': params.target_energy = 0.3; params.target_acousticness = 0.7; break;
            case 'Romantik': params.target_valence = 0.6; params.target_acousticness = 0.5; params.seed_genres = ['romance', 'turkish-pop']; break;
            case 'Parti': params.target_danceability = 0.9; params.target_energy = 0.9; params.seed_genres = ['party', 'pop', 'dance']; break;
            // Diğer ruh halleri için de benzer eşleştirmeler eklenebilir.
          }
        }

        // Seed sağlanıp sağlanmadığını kontrol et (en az bir seed_genres veya target_* olmalı)
        const hasSeeds = params.seed_artists || params.seed_genres || params.seed_tracks || 
                       Object.keys(params).some(k => k.startsWith('target_'));

        if (!hasSeeds && !params.seed_genres?.length) {
            // Eğer spesifik bir türe/mood'a map edemediysek ve genel bir genre yoksa, genel popüler bir şey önerebiliriz.
            // Veya kullanıcıya daha spesifik olması için geri bildirim verebiliriz.
            // Şimdilik, eğer hiçbir seed yoksa, günün hitlerini döndürelim.
            console.warn("Öneri için yeterli seed bulunamadı, günün hitleri denenecek.");
            try {
                const tracks = await getTodaysTopHits(accessToken, '37i9dQZF1DXcBWIGoYBM5M', 3);
                if (tracks.length > 0) return tracks;
                return "Ne istediğini tam anlayamadım ama işte sana günün popülerlerinden birkaçı!";
            } catch (error) {
                console.error('Error fetching recommendations (fallback to top hits):', error);
                return 'Öneri getirirken bir sorun oluştu, daha sonra tekrar deneyebilirsin.';
            }
        }

        try {
          const tracks = await getRecommendationsSpotify(params, accessToken);
          if (tracks.length > 0) {
            return tracks;
          } else {
            return `${userFeedback} Ancak şu anda uygun şarkı bulamadım. Belki başka bir şey denemek istersin?`;
          }
        } catch (error) {
          console.error('Error fetching recommendations:', error);
          return 'Şarkı önerileri alınırken bir hata oluştu.';
        }
      }
      return 'Ne tür veya hangi ruh halinde müzik istediğini belirtir misin? Örneğin: "Karadeniz türküleri çal" veya "Mutlu şarkılar öner"';

    default:
      return "Üzgünüm, ne demek istediğini tam olarak anlayamadım. Şimdilik sana sanatçıların en popüler şarkılarını veya günün hitlerini önerebilirim. Örneğin, 'Tarkan en sevilen 3 şarkısı' veya 'Bugün ne dinlesem?' diyebilirsin.";
  }
}
