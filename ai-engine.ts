/**
 * AI Engine - Müzik Asistanı Ana Yapay Zeka Motoru
 * 
 * Bu modül, tüm yapay zeka bileşenlerini entegre eden merkezi bir kontrolcüdür.
 * NLP, bilgi grafiği, bağlam yönetimi ve öneri sistemlerini koordine eder.
 */


import { Song } from '@shared/schema';

// NLP Modülleri
import { AdvancedLanguageUnderstanding } from './nlp/advanced/language-understanding';
import { MusicQueryProcessor } from './nlp/advanced/music-query-processor';

// Bilgi Grafiği Modülleri
import { KnowledgeGraph } from './knowledge/graph-query';

// Bağlam ve Kişiselleştirme Modülleri
import { ConversationMemory } from './context/conversation-memory';
import { UserProfile } from './user/user-profile';
import { MoodDetector, MoodType } from './context/mood-detector';

// Müzik niyet türleri - Intent tipi tanımlaması
export enum MusicIntent {
  PLAY_SONG = 'playSong',
  FIND_SONG = 'findSong',
  RECOMMEND_SONG = 'recommendSong',
  PLAY_ARTIST = 'playArtist',
  FIND_ARTIST = 'findArtist',
  PLAY_PLAYLIST = 'playPlaylist',
  FIND_PLAYLIST = 'findPlaylist',
  MOOD_PLAYLIST = 'moodPlaylist',
  SIMILAR_SONGS = 'similarSongs',
  SONG_INFO = 'songInfo',
  ARTIST_INFO = 'artistInfo',
  HELP = 'help'
}

// Müzik niyet string denetimi için yardımcı fonksiyon
export function getMusicIntentString(intent: any): string {
  if (typeof intent === 'string') {
    return intent;
  }
  return String(intent);
}

// Müzik varlık tanımı
export interface MusicEntity {
  mood?: string;
  songId?: string;
  artistId?: string;
  artist?: string;
  [key: string]: any;
}

// Entities yardımcı fonksiyonları
export function getEntityValue(entities: Record<string, any> | undefined, key: string): any {
  if (!entities) return undefined;
  return entities[key];
}

// AI Sonuç Tipleri
export interface AIResponse {
  text: string;
  songs?: Song[];
  playlists?: any[];
  artists?: any[];
  intentDetected?: string;
  entities?: Record<string, any>;
  confidence: number;
  suggestedActions?: {
    action: string;
    text: string;
    data?: any;
  }[];
  contextUpdates?: Record<string, any>;
}

export interface AIQueryOptions {
  useContext?: boolean;
  returnSongs?: boolean;
  returnPlaylists?: boolean;
  returnArtists?: boolean;
  maxResults?: number;
  filterExplicit?: boolean;
  preferredLanguages?: string[];
}

export class AIEngine {

  private nlu: AdvancedLanguageUnderstanding;
  private queryProcessor: MusicQueryProcessor;
  private knowledgeGraph: KnowledgeGraph;
  private conversationMemory: ConversationMemory;
  private moodDetector: MoodDetector;
  private userProfiles: Map<string, UserProfile> = new Map();
  
  constructor() {

    this.nlu = new AdvancedLanguageUnderstanding();
    this.queryProcessor = new MusicQueryProcessor(this.nlu);
    this.knowledgeGraph = new KnowledgeGraph();
    this.conversationMemory = new ConversationMemory();
    this.moodDetector = new MoodDetector();
    
    // Başlangıç işlemleri
    this.initialize();
  }
  
  /**
   * AI Engine'i başlatır
   */
  private async initialize(): Promise<void> {
    try {
      // Bilgi grafiğini yükle
      await this.knowledgeGraph.initialize();
      
      console.log('AI Engine başarıyla başlatıldı!');
    } catch (error) {
      console.error('AI Engine başlatılırken hata:', error);
    }
  }
  
  /**
   * Kullanıcı profilini getirir veya oluşturur
   * @param userId Kullanıcı ID'si
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Önbellekte profil kontrolü
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }
    
    // Profili yükle
    const profile = await UserProfile.load(userId);
    this.userProfiles.set(userId, profile);
    return profile;
  }
  
  /**
   * Kullanıcı sorgusunu işler ve yanıt üretir
   * @param query Kullanıcı sorgusu
   * @param userId Kullanıcı ID'si
   * @param options Sorgu seçenekleri
   */
  public async processQuery(
    query: string,
    userId: string,
    options: AIQueryOptions = {}
  ): Promise<AIResponse> {
    try {
      // Varsayılan seçenekleri ayarla
      const queryOptions: AIQueryOptions = {
        useContext: true,
        returnSongs: true,
        maxResults: 10,
        filterExplicit: false,
        ...options
      };
      
      // 1. Kullanıcı profilini yükle
      const userProfile = await this.getUserProfile(userId);
      
      // 2. Sorguyu konuşma hafızasına kaydet
      await this.conversationMemory.addUserQuery(userId, query);
      
      // 3. Bağlamsal referansları çözümle
      const { resolvedText, referencedEntities } = 
        queryOptions.useContext 
          ? await this.conversationMemory.resolveContextualReferences(query, userId)
          : { resolvedText: query, referencedEntities: {} };
      
      // 4. Doğal dil anlama ile sorguyu analiz et
      const nluResult = await this.nlu.understand(resolvedText, userId);
      
      // 5. Sorguyu müzik sorgusuna dönüştür
      const musicQuery = await this.queryProcessor.processQuery(resolvedText, userId);
      
      // 6. Yanıt oluştur
      let response: AIResponse = {
        text: '',
        confidence: nluResult.confidence,
        intentDetected: getMusicIntentString(nluResult.intent),
        entities: nluResult.entities
      };
      
      // 7. Amaca göre işlem yap
      switch (getMusicIntentString(nluResult.intent)) {
        case MusicIntent.PLAY_SONG:
        case MusicIntent.FIND_SONG:
        case MusicIntent.RECOMMEND_SONG:
          try {
            // Şarkı arama veya önerme - mockdata kullanarak örnek sonuç üretelim
            // Not: Gerçek uygulamada knowledgeGraph.findSongs kullanılacak
            const songs = await this.mockFindSongs(
              musicQuery, 
              queryOptions.maxResults || 10
            );
            
            response.songs = songs;
            response.text = this.generateResponseText(getMusicIntentString(nluResult.intent), songs, nluResult.entities);
            
            // Ruh hali tabanlı eylemler
            const mood = getEntityValue(nluResult.entities, 'mood');
            if (mood) {
              // Bağlam güncellemesi
              response.contextUpdates = {
                currentMood: mood as string
              };
              
              // Kullanıcı profili güncellemesi
              await userProfile.updateWithInteraction(getMusicIntentString(nluResult.intent), nluResult.entities, songs);
            }
          } catch (error) {
            console.error('Song search error:', error);
            response.text = "Aradığınız şarkıyı bulurken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.PLAY_ARTIST:
        case MusicIntent.FIND_ARTIST:
          try {
            // Sanatçı arama - mockdata kullanarak örnek sonuç üretelim
            // Not: Gerçek uygulamada knowledgeGraph.findArtists kullanılacak
            const artists = await this.mockFindArtists(
              musicQuery,
              queryOptions.maxResults || 5
            );
            
            response.artists = artists;
            response.text = this.generateResponseText(getMusicIntentString(nluResult.intent), undefined, nluResult.entities, artists);
          } catch (error) {
            console.error('Artist search error:', error);
            response.text = "Aradığınız sanatçıyı bulurken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.PLAY_PLAYLIST:
        case MusicIntent.FIND_PLAYLIST:
          try {
            // Çalma listesi arama - mockdata kullanarak örnek sonuç üretelim
            // Not: Gerçek uygulamada knowledgeGraph.findPlaylists kullanılacak
            const playlists = await this.mockFindPlaylists(
              musicQuery,
              queryOptions.maxResults || 5
            );
            
            response.playlists = playlists;
            response.text = this.generateResponseText(getMusicIntentString(nluResult.intent), undefined, nluResult.entities, undefined, playlists);
          } catch (error) {
            console.error('Playlist search error:', error);
            response.text = "Aradığınız çalma listesini bulurken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.MOOD_PLAYLIST:
          try {
            // Ruh haline göre şarkı önerisi
            const mood = getEntityValue(nluResult.entities, 'mood') as string || 'happy';
            const moodSongs = await this.moodDetector.findSongsByMood(mood as MoodType, queryOptions.maxResults || 10);
            
            response.songs = moodSongs;
            response.text = this.generateResponseText('moodPlaylist', moodSongs, { mood });
            
            // Bağlam güncellemesi
            response.contextUpdates = {
              currentMood: mood
            };
          } catch (error) {
            console.error('Mood playlist error:', error);
            response.text = "Ruh haline göre şarkı önerirken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.SIMILAR_SONGS:
          try {
            // Benzer şarkıları bulma
            let seedSongId = '';
            
            // Eğer entities içinde songId varsa
            const entitySongId = getEntityValue(nluResult.entities, 'songId');
            if (entitySongId) {
              seedSongId = entitySongId as string;
            } 
            // Veya bağlamdan referans alınan bir şarkı varsa
            else if (referencedEntities.song) {
              seedSongId = referencedEntities.song.id;
            }
            // Veya kullanıcının mevcut bağlamında bir şarkı varsa
            else {
              const context = await this.conversationMemory.getContext(userId);
              if (context.currentSong) {
                seedSongId = context.currentSong.id;
              }
            }
            
            if (seedSongId) {
              // Mock data kullanarak benzer şarkılar üretelim
              // Not: Gerçek uygulamada knowledgeGraph.findSimilarSongs kullanılacak
              const similarSongs = await this.mockFindSimilarSongs(
                seedSongId,
                queryOptions.maxResults || 10
              );
              
              response.songs = similarSongs;
              response.text = this.generateResponseText(MusicIntent.SIMILAR_SONGS, similarSongs, nluResult.entities);
            } else {
              response.text = "Benzer şarkılar önermem için önce bir şarkı çalmanız veya belirtmeniz gerekiyor.";
            }
          } catch (error) {
            console.error('Similar songs error:', error);
            response.text = "Benzer şarkılar bulurken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.SONG_INFO:
          try {
            // Şarkı bilgisi
            let songInfo = null;
            
            const entitySongId = getEntityValue(nluResult.entities, 'songId');
            if (entitySongId) {
              console.warn('Xata client removed. SONG_INFO for entitySongId needs real API implementation.');
              songInfo = null;
            } else if (referencedEntities.song) {
              console.warn('Xata client removed. SONG_INFO for referencedEntities.song.id needs real API implementation.');
              songInfo = null;
            }
            
            if (songInfo) {
              response.text = this.generateSongInfoText(songInfo);
            } else {
              response.text = "Hangi şarkı hakkında bilgi istediğinizi anlayamadım.";
            }
          } catch (error) {
            console.error('Song info error:', error);
            response.text = "Şarkı bilgisini alırken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.ARTIST_INFO:
          try {
            // Sanatçı bilgisi
            let artistInfo = null;
            
            const entityArtistId = getEntityValue(nluResult.entities, 'artistId');
            if (entityArtistId) {
              // Xata'da artists tablosu yerine all_songs_clean içinden çıkarıyoruz
              console.warn('Xata client removed. ARTIST_INFO for entityArtistId needs real API implementation.');
              artistInfo = null; // Placeholder, actual API call needed
            } else if (referencedEntities.artist) {
              artistInfo = { name: referencedEntities.artist.name, genre: '' };
            } else if (getEntityValue(nluResult.entities, 'artist')) {
              // Mock örnek sanatçı al
              const artists = await this.mockFindArtists({
                artist: getEntityValue(nluResult.entities, 'artist') as string
              }, 1);
              
              if (artists && artists.length > 0) {
                artistInfo = artists[0];
              }
            }
            
            if (artistInfo) {
              response.text = this.generateArtistInfoText(artistInfo);
            } else {
              response.text = "Hangi sanatçı hakkında bilgi istediğinizi anlayamadım.";
            }
          } catch (error) {
            console.error('Artist info error:', error);
            response.text = "Sanatçı bilgisini alırken bir sorun oluştu.";
          }
          break;
          
        case MusicIntent.HELP:
          // Yardım
          response.text = this.generateHelpText();
          break;
          
        default:
          // Bilinmeyen niyet
          response.text = "Üzgünüm, ne demek istediğinizi anlayamadım. Müzik çalmak, öneriler almak veya sanatçı bilgisi için sorabilirsiniz.";
      }
      
      // 8. Sistem yanıtını konuşma hafızasına kaydet
      await this.conversationMemory.addSystemResponse(userId, response.text, {
        intent: getMusicIntentString(nluResult.intent),
        entities: nluResult.entities,
        songs: response.songs?.map(s => s.id),
        artists: response.artists?.map(a => a.id),
        playlists: response.playlists?.map(p => p.id)
      });
      
      // 9. Bağlam güncellemesi
      if (response.contextUpdates) {
        await this.conversationMemory.updateContext(userId, response.contextUpdates);
      }
      
      // Çalınan şarkıyı bağlama ekle
      if (response.songs && response.songs.length > 0 && 
          (getMusicIntentString(nluResult.intent) === MusicIntent.PLAY_SONG || getMusicIntentString(nluResult.intent) === MusicIntent.RECOMMEND_SONG)) {
        const currentSong = response.songs[0];
        await this.conversationMemory.updateContext(userId, {
          currentSong: {
            id: currentSong.id,
            title: currentSong.title,
            artist: currentSong.artist
          }
        });
        
        // Şarkının ruh halini tespit et
        const moodResult = await this.moodDetector.detectMood(currentSong);
        
        // Bağlamı güncelle
        await this.conversationMemory.updateContext(userId, {
          currentMood: moodResult.primaryMood
        });
      }
      
      // Çalınan sanatçıyı bağlama ekle
      if (response.artists && response.artists.length > 0 && 
          (getMusicIntentString(nluResult.intent) === MusicIntent.PLAY_ARTIST || getMusicIntentString(nluResult.intent) === MusicIntent.FIND_ARTIST)) {
        const currentArtist = response.artists[0];
        await this.conversationMemory.updateContext(userId, {
          currentArtist: {
            id: currentArtist.id,
            name: currentArtist.name
          }
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('Sorgu işlenirken hata:', error);
      
      // Hata durumunda basit bir yanıt döndür
      return {
        text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        confidence: 0.5
      };
    }
  }
  
  /**
   * Yanıt metni oluşturur
   */
  private generateResponseText(
    intent: string,
    songs?: Song[],
    entities?: Record<string, any>,
    artists?: any[],
    playlists?: any[]
  ): string {
    const mood = entities?.mood as string;
    
    switch (intent) {
      case 'playSong':
        if (songs && songs.length > 0) {
          return `"${songs[0].title}" adlı şarkıyı çalıyorum. İyi dinlemeler!`;
        }
        return "Üzgünüm, istediğiniz şarkıyı bulamadım.";
        
      case 'findSong':
        if (songs && songs.length > 0) {
          return `İşte istediğiniz şarkılar: ${songs.slice(0, 3).map(s => `"${s.title}" (${s.artist})`).join(', ')}${songs.length > 3 ? ' ve daha fazlası.' : '.'}`;
        }
        return "Üzgünüm, aradığınız kriterlere uygun şarkı bulamadım.";
        
      case 'recommendSong':
        if (songs && songs.length > 0) {
          return `Size önerdiklerim: ${songs.slice(0, 3).map(s => `"${s.title}" (${s.artist})`).join(', ')}${songs.length > 3 ? ' ve daha fazlası.' : '.'}`;
        }
        return "Üzgünüm, şu anda size önerebileceğim şarkı bulamadım.";
        
      case 'playArtist':
        if (artists && artists.length > 0) {
          return `${artists[0].name} sanatçısının şarkılarını çalıyorum. İyi dinlemeler!`;
        }
        return "Üzgünüm, istediğiniz sanatçıyı bulamadım.";
        
      case 'findArtist':
        if (artists && artists.length > 0) {
          return `İşte istediğiniz sanatçılar: ${artists.map(a => a.name).join(', ')}.`;
        }
        return "Üzgünüm, aradığınız kriterlere uygun sanatçı bulamadım.";
        
      case 'playPlaylist':
      case 'findPlaylist':
        if (playlists && playlists.length > 0) {
          return `İşte istediğiniz çalma listeleri: ${playlists.map(p => p.name).join(', ')}.`;
        }
        return "Üzgünüm, aradığınız kriterlere uygun çalma listesi bulamadım.";
        
      case 'moodPlaylist':
        if (songs && songs.length > 0) {
          return `${mood || 'sevdiğiniz'} ruh haline uygun şarkılar buldum. İyi dinlemeler!`;
        }
        return `Üzgünüm, ${mood || 'istediğiniz'} ruh haline uygun şarkı bulamadım.`;
        
      case 'similarSongs':
        if (songs && songs.length > 0) {
          return `Benzer şarkılar buldum. İyi dinlemeler!`;
        }
        return "Üzgünüm, benzer şarkılar bulamadım.";
        
      default:
        return "Size nasıl yardımcı olabilirim?";
    }
  }
  
  /**
   * Şarkı bilgi metni oluşturur
   */
  private generateSongInfoText(song: any): string {
    return `"${song.title}" şarkısı ${song.artist} tarafından söyleniyor. ${song.album ? `"${song.album}" albümünde yer alıyor.` : ''} ${song.year ? `${song.year} yılında yayınlandı.` : ''} ${song.genre ? `Türü: ${song.genre}` : ''}`;
  }
  
  /**
   * Sanatçı bilgi metni oluşturur
   */
  private generateArtistInfoText(artist: any): string {
    return `${artist.name}, ${artist.genre || 'çeşitli türlerde'} müzik yapan bir ${artist.type || 'sanatçı'}. ${artist.bio || ''}`;
  }
  
  /**
   * Yardım metni oluşturur
   */
  private generateHelpText(): string {
    return `Müzik Asistanı'na hoş geldiniz! Aşağıdaki komutları kullanabilirsiniz:
    
- "X şarkısını çal" veya "Y'nin şarkılarını çal"
- "Bana Z türünde şarkılar öner"
- "Mutlu/hüzünlü/enerjik şarkılar çal"
- "Bu şarkı gibi başka şarkılar öner"
- "X sanatçısı hakkında bilgi ver"
- "Bu şarkı hakkında bilgi ver"

Nasıl yardımcı olabilirim?`;
  }
  /**
   * Mock şarkı bulma fonksiyonu (geçici)
   */
  private async mockFindSongs(_query: any, _limit: number): Promise<Song[]> {
    // TODO: Replace with actual API call
    console.warn('mockFindSongs is returning an empty array. Implement actual API call.');
    return Promise.resolve([]);
  }

  /**
   * Mock sanatçı bulma fonksiyonu (geçici)
   */
  private async mockFindArtists(_query: any, _limit: number): Promise<any[]> {
    // TODO: Replace with actual API call
    console.warn('mockFindArtists is returning an empty array. Implement actual API call.');
    return Promise.resolve([]);
  }

  /**
   * Mock çalma listesi bulma fonksiyonu (geçici)
   */
  private async mockFindPlaylists(_query: any, limit: number): Promise<any[]> {
    // Örnek çalma listeleri oluştur
    const mockPlaylists = [
      { id: 'playlist1', name: 'Pop Hits', songCount: 20 },
      { id: 'playlist2', name: 'Rock Classics', songCount: 15 },
      { id: 'playlist3', name: 'Chill Vibes', songCount: 18 },
      { id: 'playlist4', name: 'Workout Mix', songCount: 25 },
      { id: 'playlist5', name: 'Turkish Favorites', songCount: 30 }
    ];
    
    return mockPlaylists.slice(0, limit);
  }

  /**
   * Mock benzer şarkı bulma fonksiyonu (geçici)
   */
  private async mockFindSimilarSongs(_songId: string, limit: number): Promise<Song[]> {
    return this.mockFindSongs({}, limit);
  }

  /**
   * Kullanıcı için kişiselleştirilmiş öneriler oluşturur
   * @param userId Kullanıcı ID'si
   * @param count Öneri sayısı
   */
  public async generatePersonalizedRecommendations(
    userId: string,
    count: number = 10
  ): Promise<Song[]> {
    try {
      // Kullanıcı profilini al
      const userProfile = await this.getUserProfile(userId);
      
      // Favori türleri al
      const topGenres = userProfile.getTopGenres(3);
      
      // Favori sanatçıları al
      const topArtists = userProfile.getTopArtists(3);
      
      // Favori ruh hallerini al
      // Not: topMoods şu anda kullanılmıyor, ancak gelecekte entegrasyon için tutuyoruz
      // const topMoods = userProfile.getTopMoods(2);
      
      // Mock öneriler oluştur (gerçek uygulamada knowledgeGraph.getRecommendations kullanılacak)
      const recommendations = await this.mockFindSongs({ 
        genres: topGenres,
        artists: topArtists
      }, count);
      
      // Kullanıcı profilini güncelle
      if (recommendations.length > 0) {
        await userProfile.logRecommendation(recommendations, 'personalized');
      }
      
      return recommendations;
      
    } catch (error) {
      console.error('Kişiselleştirilmiş öneriler oluşturulurken hata:', error);
      return [];
    }
  }
  
  /**
   * Kullanıcının dinleme geçmişine göre haftalık özet oluşturur
   * @param userId Kullanıcı ID'si
   */
  public async generateWeeklySummary(userId: string): Promise<Record<string, any>> {
    try {
      // Kullanıcı profilini al
      const userProfile = await this.getUserProfile(userId);
      
      // Özet bilgileri al
      const summary = userProfile.getSummary();
      
      // Haftanın en çok dinlenen şarkılarını bul
      // Not: Bu, gerçek bir uygulamada veritabanı sorgusu ile yapılır
      
      return {
        ...summary,
        weeklyTopSongs: [], // Veritabanından alınacak
        weeklyTopArtists: [], // Veritabanından alınacak
        listeningMinutes: 0, // Veritabanından alınacak
        newDiscoveries: [] // Veritabanından alınacak
      };
      
    } catch (error) {
      console.error('Haftalık özet oluşturulurken hata:', error);
      return {};
    }
  }
}
