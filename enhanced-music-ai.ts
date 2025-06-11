/**
 * MÃ¼zikBeyin - Ultra GeliÅŸmiÅŸ MÃ¼zik Yapay ZekasÄ±
 * 
 * Bu modÃ¼l, kullanÄ±cÄ±larÄ±n mÃ¼zik tercihlerini analiz ederek kiÅŸiselleÅŸtirilmiÅŸ 
 * Ã¶neriler oluÅŸturan ileri seviye bir yapay zeka sistemidir. KullanÄ±cÄ±nÄ±n dinleme 
 * geÃ§miÅŸinden, arama sorgularÄ±ndan ve aÃ§Ä±k geri bildirimlerinden Ã¶ÄŸrenir.
 * 
 * Yetenekler:
 * - MÃ¼zik analizi ve tanÄ±ma
 * - Duygu temelli mÃ¼zik eÅŸleÅŸtirme
 * - GerÃ§ek zamanlÄ± kullanÄ±cÄ± davranÄ±ÅŸ analizi
 * - DoÄŸal dil iÅŸleme ile sorgu anlama
 * - Ã–ÄŸrenme ve kiÅŸiselleÅŸtirme
 * - Ã‡apraz tÃ¼r Ã¶neri algoritmalarÄ±
 * - Sosyal Ã¶ÄŸrenme ve grup dinamikleri
 * - BaÄŸlam farkÄ±ndalÄ±ÄŸÄ± (zaman, yer, aktivite)
 */

// Temel kÃ¼tÃ¼phaneler
import { UserProfile, UserPreferences, ListeningHistoryItem } from './user/user-profile';
import { RecommendationParameters } from './types/recommendation-types';
import { Song } from '../types/music-types';

// NLU (Natural Language Understanding) sonuç türleri
export interface MusicIntent {
  type: 'play' | 'discover' | 'info' | 'playlist' | 'like' | 'dislike' | 'recommendation' | 'analysis';
  confidence: number;
  subType?: string;
}

export interface MusicEntity {
  type: 'artist' | 'song' | 'album' | 'genre' | 'era' | 'mood' | 'playlist' | 'instrument' | 'feature';
  value: string;
  confidence: number;
  startPos?: number;
  endPos?: number;
  metadata?: Record<string, any>;
}

export interface MusicConstraint {
  type: 'tempo' | 'energy' | 'popularity' | 'recency' | 'familiarity' | 'duration';
  operation: 'equal' | 'less_than' | 'greater_than' | 'between' | 'not';
  value: any;
  confidence: number;
}

export interface NLUResult {
  language: string;
  intent: MusicIntent;
  entities: MusicEntity[];
  constraints: MusicConstraint[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  originalText: string;
  normalizedText: string;
  confidence: number;
  rawAnalysis: any; // Altta yatan NLP modelinin ham çıktısı
}

/**
 * EnhancedMusicAI.processQuery metodunun dönüş tipi için arayüz.
 */
export interface ProcessQueryResult {
  response: string;
  songs?: Song[];
  relatedMoods: string[];
  categoryFilters: {
    genres?: string[];
    moods?: string[];
    eras?: string[];
    locations?: string[]; // veya regions
    [key: string]: any; // Esneklik için
  };
  playableResults: boolean;
  // AI'dan dönebilecek diğer potansiyel alanlar eklenebilir
}

/**
 * Ã–ÄŸrenme sonuÃ§larÄ± arayÃ¼zÃ¼ - kullanÄ±cÄ±larÄ±n davranÄ±ÅŸlarÄ±ndan elde edilen Ã¶ÄŸrenme sonucu
 */
export interface LearningResult {
  genre?: Record<string, number>;
  mood?: Record<string, number>;
  artists?: Record<string, number>;
  features?: Record<string, number>;
  lyrics?: Record<string, number>;
  instruments?: Record<string, number>;
  eras?: Record<string, number>;
  listening_patterns?: {
    time_of_day?: Record<string, number>; // GÃ¼nÃ¼n hangi saatlerinde dinliyor
    day_of_week?: Record<string, number>; // HaftanÄ±n hangi gÃ¼nleri dinliyor
    duration?: Record<string, number>;    // Dinleme sÃ¼releri (kÄ±sa/uzun)
    repeat_behavior?: Record<string, number>; // Tekrar dinleme davranÄ±ÅŸÄ±
  };
}

/**
 * MÃ¼zik asistanÄ± iÃ§in kullanÄ±cÄ± etkileÅŸim tipi
 */
export interface UserInteraction {
  type: 'play' | 'search' | 'like' | 'dislike' | 'skip' | 'complete' | 'recommend' | 'query';
  songId?: string;
  songDetails?: Song;
  timestamp: number | Date; // Hem sayÄ± hem de Date objesi olabilir
  query?: string;
  duration?: number;
  successful?: boolean;
  feedback?: string;
  rating?: number; // 1-5 arasÄ± deÄŸerlendirme
  addedToPlaylist?: boolean;
  sharedWithOthers?: boolean;
  details?: Record<string, any>; // Esnek ilave detaylar 
  explicitFeedback?: {
    type?: string;
    value?: string;
  };
}

/**
 * HaftalÄ±k Ã¶zet dÃ¶nÃ¼ÅŸ tipi
 */
export interface WeeklySummary {
  topArtists: string[];
  topGenres: string[];
  dominantMood: string;
  recommendedSongs: Song[];
}

// Alt modÃ¼ller ve iÅŸlemciler
import { NLPProcessor } from './nlp/nlp-processor';
import { MusicAnalyzer } from './music/music-analyzer';
import { EmotionDetector } from './emotion/emotion-detector';
import { ContextManager } from './context/context-manager';
import { MusicRecommender } from './recommender/music-recommender';
import { LearningEngine } from './learning/learning-engine';

// LearningResult ve UserBehaviorData tiplerini doÄŸrudan learning-engine.ts'ten import etmiyoruz
// Ã§Ã¼nkÃ¼ dÃ¶ngÃ¼sel baÄŸÄ±mlÄ±lÄ±k olmamasÄ± iÃ§in bunlar orada da tanÄ±mlanmÄ±ÅŸ durumda

// DÄ±ÅŸa aktarÄ±lacak tÃ¼rler
export type { UserProfile, UserPreferences, ListeningHistoryItem };

// Song tipi artÄ±k ../types/music-types'ten import ediliyor

// DÄ±ÅŸ kÃ¼tÃ¼phaneler iÃ§in tip tanÄ±mlamalarÄ±
declare module 'compromise' {
  export function compromise(text: string): any;
}

declare module 'sentiment' {
  export function analyze(text: string, options?: any): any;
}

// YardÄ±mcÄ± tÃ¼rler ve arayÃ¼zler
// LearningResult tipi artÄ±k learning-engine.ts'den import ediliyor

/**
 * BaÄŸlam bilgisi arayÃ¼zÃ¼ - mÃ¼zik dinleme sÄ±rasÄ±nda mevcut ortam bilgisi
 */
export interface ContextInfo {
  timeOfDay?: string;          // GÃ¼nÃ¼n saati (sabah, Ã¶ÄŸlen, akÅŸam, gece)
  dayOfWeek?: number;          // HaftanÄ±n gÃ¼nÃ¼ (0-6)
  season?: string;             // Mevsim
  location?: string;           // Konum tipi (ev, iÅŸ, araba, spor vb.)
  activity?: string;           // Aktivite (spor, Ã§alÄ±ÅŸma, dinlenme vb.)
  weather?: string;            // Hava durumu (yaÄŸmurlu, gÃ¼neÅŸli vb.)
  recentSongs?: Song[];        // Son dinlenen ÅŸarkÄ±lar
  mood?: string;               // KullanÄ±cÄ±nÄ±n ruh hali
  companionship?: string;      // YalnÄ±z mÄ± yoksa baÅŸkalarÄ±yla mÄ±
  device?: string;             // Hangi cihazda dinleniyor
  audioQuality?: string;       // Ses kalitesi (normal, yÃ¼ksek kalite vb.)
  previousActivity?: string;   // Ã–nceki aktivite
  nextPlannedActivity?: string; // Sonraki planlanan aktivite
  energyLevel?: number;        // Enerji seviyesi (1-10)
}

/**
 * KullanÄ±cÄ± davranÄ±ÅŸ verisi arayÃ¼zÃ¼ - bir ÅŸarkÄ± dinleme eylemi sÄ±rasÄ±nda toplanan veri
 */
export interface UserBehaviorData {
  songId: string;              // Dinlenen ÅŸarkÄ±nÄ±n kimliÄŸi
  listenDuration: number;      // Dinleme sÃ¼resi (saniye)
  completed: boolean;          // ÅžarkÄ± sonuna kadar dinlendi mi
  skipped: boolean;            // ÅžarkÄ± atlandÄ± mÄ±
  timestamp: Date;             // Dinleme zamanÄ±
  rating?: number;             // KullanÄ±cÄ± deÄŸerlendirmesi (1-5)
  contextInfo?: ContextInfo;    // Dinleme baÄŸlam bilgisi
  repeatCount?: number;        // KaÃ§ kez tekrar dinlendi
  volumeLevel?: number;        // Ses dÃ¼zeyi (0-100)
  addedToPlaylist?: boolean;   // Ã‡alma listesine eklendi mi
  sharedWithOthers?: boolean;  // BaÅŸkalarÄ±yla paylaÅŸÄ±ldÄ± mÄ±
  explicitFeedback?: {         // AÃ§Ä±k geri bildirim
    type?: string;              // Geri bildirim tÃ¼rÃ¼
    value?: string;             // Geri bildirim deÄŸeri
    isPositive?: boolean;       // Olumlu mu
  };
  seekBehavior?: {             // ÅžarkÄ± iÃ§inde gezinme davranÄ±ÅŸÄ±
    seekCount?: number;         // Gezinme sayÄ±sÄ±
    seekPositions?: number[];   // Gezinme pozisyonlarÄ± (saniye)
  };
  followUpAction?: string;     // Dinlemeden sonraki eylem
}

/**
 * MÃ¼zik Ã¶zellikleri arayÃ¼zÃ¼ - bir ÅŸarkÄ±nÄ±n teknik ve duygusal Ã¶zellikleri
 */
export interface MusicFeatures {
  tempo: number;              // BPM olarak tempo
  energy: number;             // Enerji seviyesi (0-1)
  valence: number;            // Pozitiflik seviyesi (0-1)
  danceability: number;       // Dans edilebilirlik (0-1)
  instrumentalness: number;   // EnsÃ¼rÃ¼mantal olma derecesi (0-1)
  acousticness: number;       // AkÃ¼stik olma derecesi (0-1)
  liveness: number;           // CanlÄ± performans hissi (0-1)
  speechiness: number;        // KonuÅŸma iÃ§erme oranÄ± (0-1)
  key?: number;               // Anahtar (0-11, C=0, C#=1 vb.)
  mode?: number;              // Mod (0 = minÃ¶r, 1 = majÃ¶r)
  timeSignature?: number;     // Zaman iÅŸareti (3/4, 4/4 vb.)
  loudness?: number;          // YÃ¼ksek ses seviyesi (dB)
}

/**
 * Duygu analizi sonuÃ§ arayÃ¼zÃ¼
 */
export interface EmotionAnalysisResult {
  dominantEmotion: string;     // BaskÄ±n duygu
  emotionScores: {            // Duygu puanlarÄ±
    happiness: number;         // Mutluluk (0-1)
    sadness: number;           // ÃœzÃ¼ntÃ¼ (0-1)
    anger: number;             // Ã–fke (0-1)
    fear: number;              // Korku (0-1)
    surprise: number;          // ÅžaÅŸkÄ±nlÄ±k (0-1)
    disgust: number;           // Tiksinti (0-1)
    neutral: number;           // NÃ¶tr (0-1)
  };
  intensity: number;           // Duygu yoÄŸunluÄŸu (0-1)
  complexity: number;          // Duygusal karmaÅŸÄ±klÄ±k (0-1)
  sentiment: number;           // Genel duygu deÄŸeri (-1 ila 1)
}

/**
 * Dil Ã§Ã¶zÃ¼mleme sonuÃ§ arayÃ¼zÃ¼
 */
export interface LanguageProcessingResult {
  intent: string;             // Niyet ("mÃ¼zik-Ã¶ner", "bilgi-iste" vb.)
  entities: {                 // VarlÄ±klar
    artists: string[];        // SanatÃ§Ä±lar
    genres: string[];         // TÃ¼rler
    songs: string[];          // ÅžarkÄ±lar
    moods: string[];          // Ruh halleri
    timeframe: string;        // Zaman dilimi
    quantity: number;         // Miktar
    other: Record<string, any>; // DiÄŸer varlÄ±klar
  };
  sentiment: number;          // Duygu deÄŸeri (-1 ila 1)
  complexity: number;         // Dilsel karmaÅŸÄ±klÄ±k (0-1)
  keywords: string[];         // Anahtar kelimeler
  languageDetected: string;      // Tespit edilen dil
}

/**
 * HaftalÄ±k Ã¶zet iÃ§in kullanÄ±lan karÅŸÄ±laÅŸtÄ±rma bilgileri
 */
export interface WeeklyComparisonData {
  newDiscoveries: Song[];        // Yeni keÅŸifler
  insightText: string;           // Ã–zet iÃ§in metin
  comparedToPrevious: {        // Ã–nceki haftaya gÃ¶re deÄŸiÅŸim
    listeningTime: number;      // Dinleme sÃ¼resi deÄŸiÅŸimi (yÃ¼zde)
    moodShift: boolean;         // Ruh hali deÄŸiÅŸimi
    genreExploration: number;   // TÃ¼r keÅŸif oranÄ±
    artistDiversity: number;    // SanatÃ§Ä± Ã§eÅŸitliliÄŸi deÄŸiÅŸimi
  };
}

/**
 * Sorgu analizi sonuÃ§ arayÃ¼zÃ¼ - kullanÄ±cÄ± sorgusunun analiz edilmiÅŸ hali
 */
export interface QueryAnalysisResult {
  intent: string;                // AmaÃ§ (search, recommend, play vb.)
  entities: {                    // VarlÄ±klar
    artists?: string[];          // SanatÃ§Ä±lar
    genres?: string[];           // TÃ¼rler
    moods?: string[];            // Ruh halleri
    eras?: string[];             // DÃ¶nemler
    lyrics?: string[];           // SÃ¶z anahtar kelimeleri
    tempo?: string;              // Tempo (hÄ±zlÄ±, yavaÅŸ vb.)
    instruments?: string[];      // Ã‡algÄ±lar
    occasions?: string[];        // Vesileler (parti, dÃ¼ÄŸÃ¼n vb.)
    languages?: string[];        // Diller
    locations?: string[];        // Yerler
  };
  filters: {                     // Filtreler
    minYear?: number;            // Minimum yÄ±l
    maxYear?: number;            // Maksimum yÄ±l
    excludeArtists?: string[];   // HariÃ§ tutulacak sanatÃ§Ä±lar
    excludeGenres?: string[];    // HariÃ§ tutulacak tÃ¼rler
  };
  sortBy?: string;               // SÄ±ralama kriteri
  limit?: number;                // SonuÃ§ limiti
  emotionalContext?: EmotionAnalysisResult; // Duygusal baÄŸlam
  rawText: string;               // Ham metin
  confidence: number;            // GÃ¼ven seviyesi (0-1)
  languageDetected: string;      // Tespit edilen dil
}

// WeeklyComparisonData tanÄ±mÄ± yukarÄ±da yapÄ±ldÄ±

/**
 * HaftalÄ±k Ã¶zet dÃ¶nÃ¼ÅŸ tipi
 */
export interface WeeklySummary {
  topArtists: string[];
  topGenres: string[];
  dominantMood: string;
  recommendedSongs: Song[];
}

// UserProfile, UserPreferences, ListeningHistoryItem ve UserInteraction 
// artÄ±k ./user/user-profile modÃ¼lÃ¼nden import edildiÄŸi iÃ§in burada yeniden tanÄ±mlamaya gerek yok

/**
 * Ana yapay zeka sÄ±nÄ±fÄ± - MÃ¼zik asistanÄ± yapÄ±sÄ±nÄ±n beyni
 */
export class EnhancedMusicAI {
  // Ã–zel Ã¶zellikler
  private readonly userProfileCache: Map<string, UserProfile> = new Map();
  private nlpProcessor: NLPProcessor;
  private musicAnalyzer: MusicAnalyzer;
  private emotionDetector: EmotionDetector;
  private contextManager: ContextManager;
  private recommender: MusicRecommender;
  private learningEngine: LearningEngine;
  
  // Not: AÅŸaÄŸÄ±daki etiketler daha sonra kullanÄ±lmak Ã¼zere saklanmÄ±ÅŸtÄ±r.
  // Åžu an iÃ§in aktif olarak kullanÄ±lmamaktadÄ±r, ancak Ã¶nerici algoritmalarda referans olarak kullanÄ±labilir.
  
  /*
  // TÃ¼rkÃ§e MÃ¼zik TÃ¼rleri
  [{ id: 'pop', label: 'Pop' }, { id: 'rock', label: 'Rock' }, ...]
  
  // Ruh Hali Etiketleri
  [{ id: 'mutlu', label: 'Mutlu' }, { id: 'huzunlu', label: 'HÃ¼zÃ¼nlÃ¼' }, ...]
  
  // DÃ¶nem Etiketleri
  [{ id: '60lar', label: '60\'lar' }, { id: '70ler', label: '70\'ler' }, ...]
  
  // BÃ¶lgesel Etiketler
  [{ id: 'turkiye', label: 'TÃ¼rkiye' }, { id: 'karadeniz', label: 'Karadeniz' }, ...]
  */
  
  /**
   * YapÄ±landÄ±rÄ±cÄ± - tÃ¼m alt sistemleri baÅŸlat
   */
  constructor() {
    // Alt sistemleri baÅŸlat
    this.nlpProcessor = new NLPProcessor();
    this.musicAnalyzer = new MusicAnalyzer();
    this.emotionDetector = new EmotionDetector();
    this.contextManager = new ContextManager();
    this.recommender = new MusicRecommender();
    this.learningEngine = new LearningEngine();
    
    // AlÄ±ÅŸma verilerini yÃ¼kle
    this.preloadData();
    
    console.log('MÃ¼zikBeyin Ultra GeliÅŸmiÅŸ Yapay Zeka baÅŸlatÄ±ldÄ±!');
  }
  
  /**
   * Ã–n yÃ¼kleme iÅŸlemleri
   */
  private async preloadData(): Promise<void> {
    try {
      // Ã–rnek verileri yÃ¼kle
      console.log('Ã–n yÃ¼kleme tamamlandÄ±.');
    } catch (error) {
      console.error('Ã–n yÃ¼kleme sÄ±rasÄ±nda hata:', error);
    }
  }
  

  
  /**
   * Gets the user profile from cache or loads it from the database
   * @param userId User ID
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Check if we have the profile in cache
    if (this.userProfileCache.has(userId)) {
      return this.userProfileCache.get(userId)!;
    }
    
    try {
      // UserProfile sÄ±nÄ±fÄ±nÄ±n yapÄ±landÄ±rÄ±cÄ±sÄ±na user ID ile Ã§aÄŸrÄ± yaparak yeni profil oluÅŸtur
      const profile = new UserProfile(userId);
      
      // Bu Ã¶rnekte, UserProfile sÄ±nÄ±fÄ±nÄ±n load metodu bir promise dÃ¶ndÃ¼rÃ¼yor olabilir
      // Veya UserProfile constructor'da otomatik yÃ¼kleme yapÄ±yor olabilir
      
      // Cache the profile
      this.userProfileCache.set(userId, profile);
      
      return profile;
    } catch (error) {
      console.error(`Error creating/loading user profile for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Saves the user profile to the database
   * @param userProfile User profile to save
   */
  async saveUserProfile(userProfile: UserProfile): Promise<boolean> {
    try {
      // Use the UserProfile's save method
      const success = await userProfile.save();
      
      // Update the cache if successful
      if (success) {
        this.userProfileCache.set(userProfile.userId, userProfile);
      }
      
      return success;
    } catch (error) {
      console.error(`Error saving user profile for user ${userProfile.userId}:`, error);
      return false;
    }
  }
  
  /**
   * Learns from user behavior and updates their profile
   * @param userId User ID
   * @param behaviorData User behavior data including song interactions
   */
  async learnFromUserBehavior(userId: string, behaviorData: UserBehaviorData): Promise<boolean> {
    try {
      if (!userId || !behaviorData || !behaviorData.songId) {
        console.error('GeÃ§ersiz kullanÄ±cÄ± ID veya davranÄ±ÅŸ verisi');
        return false;
      }

      // Get the user profile
      // const userProfile = await this.getUserProfile(userId); // Commented out as it's unused after Xata-dependent code removal
      
      // Get the song details from database
      // TODO: Reimplement song fetching with the new database system.
      // Xata client usage removed.
      console.warn(`[EnhancedMusicAI] learnFromUserBehavior: Song fetching for songId ${behaviorData.songId} needs to be reimplemented without Xata.`);
      const song: Song | null = null; // Placeholder for song data

      if (!song) { // This will always be true for now
        console.error(`[EnhancedMusicAI] learnFromUserBehavior: Song with ID ${behaviorData.songId} not found (Xata fetching removed). Further processing in this function might be affected.`);
        // For now, let's return false as the original logic did.
        return false;
      }
      
      /*
      // TODO: This block is commented out because 'song' is currently always null after Xata removal.
      // Re-evaluate this logic when song fetching is reimplemented with the new database.

      // Process the user's behavior with this song
      const learningResult: LearningResult = {
        genre: {},
        mood: {},
        artists: {}
      };
      
      // Calculate a score based on user behavior
      let score = 0;
      
      // If the song was completed, that's a positive signal
      if (behaviorData.completed) {
        score += 1;
      }
      
      // If the song was skipped, that's a negative signal
      if (behaviorData.skipped) {
        score -= 2;
      }
      
      // If the user rated the song, use that as a strong signal
      if (behaviorData.rating !== undefined) {
        // Convert 1-5 rating to a -2 to +2 score
        score += (behaviorData.rating - 3);
      }
      
      // Listen duration is a positive signal if the song was listened to for more than 30 seconds
      if (behaviorData.listenDuration > 30 && !behaviorData.skipped) {
        score += 0.5;
      }
      
      // Apply the score to the song's genres
      if (song.genre && Array.isArray(song.genre)) {
        song.genre.forEach((genre: string) => {
          if (learningResult.genre) {
            learningResult.genre[genre] = score;
          }
        });
      }
      
      // Apply the score to the song's moods
      if (song.mood && Array.isArray(song.mood)) {
        song.mood.forEach((mood: string) => {
          if (learningResult.mood) {
            learningResult.mood[mood] = score;
          }
        });
      }
      
      // Apply the score to the artist
      if (song.artist && learningResult.artists) {
        learningResult.artists[song.artist] = score;
      }
      
      // Record this interaction in the user profile
      if (typeof userProfile.addListeningHistoryItem === 'function') {
        userProfile.addListeningHistoryItem({
          songId: behaviorData.songId,
          timestamp: behaviorData.timestamp,
          listenDuration: behaviorData.listenDuration,
          completed: behaviorData.completed,
          skipped: behaviorData.skipped,
          rating: behaviorData.rating
        });
      }
      
      // Record context-based interaction if context is provided
      if (behaviorData.contextInfo && typeof userProfile.addInteraction === 'function') {
        userProfile.addInteraction({
          type: 'play',
          timestamp: behaviorData.timestamp,
          details: {
            songId: behaviorData.songId,
            contextInfo: behaviorData.contextInfo
          }
        });
      }
      
      // Apply the learning results
      return await this.applyLearningResults(userId, learningResult);
      */
      return false; // Added to ensure the function returns a boolean as per its type
    } catch (error) {
      console.error(`Error learning from user behavior for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Apply learning results to update user preferences
   */
  async applyLearningResults(userId: string, learningResults: LearningResult): Promise<boolean> {
    if (!userId || !learningResults) {
      console.error('applyLearningResults: GeÃ§ersiz parametreler', { userId, learningResults });
      return false;
    }

    try {
      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      
      // KullanÄ±cÄ± tercihleri yoksa baÅŸlatma yap
      if (!userProfile.preferences) {
        userProfile.preferences = {
          favoriteGenres: [],
          favoriteMoods: [],
          favoriteArtists: [],
          dislikedGenres: [],
          dislikedArtists: [],
          listeningFrequency: 3,
          preferredLanguages: ['tr']
        };
      }

      // Array Ã¶zelliklerinin tanÄ±mlÄ± olduÄŸundan emin ol
      if (!Array.isArray(userProfile.preferences.favoriteGenres)) userProfile.preferences.favoriteGenres = [];
      if (!Array.isArray(userProfile.preferences.favoriteMoods)) userProfile.preferences.favoriteMoods = [];
      if (!Array.isArray(userProfile.preferences.favoriteArtists)) userProfile.preferences.favoriteArtists = [];
      if (!Array.isArray(userProfile.preferences.dislikedGenres)) userProfile.preferences.dislikedGenres = [];
      if (!Array.isArray(userProfile.preferences.dislikedArtists)) userProfile.preferences.dislikedArtists = [];
      
      // Update genre preferences
      if (learningResults.genre && typeof learningResults.genre === 'object') {
        for (const [genre, score] of Object.entries(learningResults.genre)) {
          if (typeof score === 'number') {
            if (score > 0 && !userProfile.preferences.favoriteGenres.includes(genre)) {
              userProfile.preferences.favoriteGenres.push(genre);
              // Keep the list manageable
              if (userProfile.preferences.favoriteGenres.length > 20) {
                userProfile.preferences.favoriteGenres = userProfile.preferences.favoriteGenres.slice(-20);
              }
            } else if (score < 0 && !userProfile.preferences.dislikedGenres.includes(genre)) {
              userProfile.preferences.dislikedGenres.push(genre);
              // Remove from favorites if present
              userProfile.preferences.favoriteGenres = userProfile.preferences.favoriteGenres.filter(g => g !== genre);
              // Keep the list manageable
              if (userProfile.preferences.dislikedGenres.length > 20) {
                userProfile.preferences.dislikedGenres = userProfile.preferences.dislikedGenres.slice(-20);
              }
            }
          }
        }
      }
      
      // Update mood preferences
      if (learningResults.mood && typeof learningResults.mood === 'object') {
        for (const [mood, score] of Object.entries(learningResults.mood)) {
          if (typeof score === 'number' && score > 0 && !userProfile.preferences.favoriteMoods.includes(mood)) {
            userProfile.preferences.favoriteMoods.push(mood);
            // Keep the list manageable
            if (userProfile.preferences.favoriteMoods.length > 10) {
              userProfile.preferences.favoriteMoods = userProfile.preferences.favoriteMoods.slice(-10);
            }
          }
        }
      }
      
      // Update artist preferences
      if (learningResults.artists && typeof learningResults.artists === 'object') {
        for (const [artist, score] of Object.entries(learningResults.artists)) {
          if (typeof score === 'number') {
            if (score > 0 && !userProfile.preferences.favoriteArtists.includes(artist)) {
              userProfile.preferences.favoriteArtists.push(artist);
              // Keep the list manageable
              if (userProfile.preferences.favoriteArtists.length > 20) {
                userProfile.preferences.favoriteArtists = userProfile.preferences.favoriteArtists.slice(-20);
              }
            } else if (score < 0 && !userProfile.preferences.dislikedArtists.includes(artist)) {
              userProfile.preferences.dislikedArtists.push(artist);
              // Remove from favorites if present
              userProfile.preferences.favoriteArtists = userProfile.preferences.favoriteArtists.filter(a => a !== artist);
              // Keep the list manageable
              if (userProfile.preferences.dislikedArtists.length > 20) {
                userProfile.preferences.dislikedArtists = userProfile.preferences.dislikedArtists.slice(-20);
              }
            }
          }
        }
      }
      
      // Save the updated profile
      return await this.saveUserProfile(userProfile);
    } catch (error) {
      console.error(`Error applying learning results for user ${userId}:`, error);
      return false;
    }
  }

    /**
   * KullanÄ±cÄ± etkileÅŸimlerini kaydeder
   * @param userId KullanÄ±cÄ± ID'si 
   * @param interaction EtkileÅŸim bilgisi
   */
  private async logUserInteraction(userId: string, interaction: UserInteraction): Promise<void> {
    try {
      // KullanÄ±cÄ± etkileÅŸimlerini kaydetmek iÃ§in bir veritabanÄ± iÅŸlemi yapÄ±labilir
      // Åžu anda sadece konsola yazdÄ±rÄ±yoruz
      console.log(`User interaction logged: ${userId}`, interaction);
      
      try {
        // KullanÄ±cÄ± profilini gÃ¼ncelleme iÅŸlemi burada yapÄ±labilir
        const userProfile = await this.getUserProfile(userId);
        if (userProfile) {
          // Profili gÃ¼ncelle ve kaydet
          await this.saveUserProfile(userProfile);
        }
      } catch (profileError: any) {
        // Profil iÅŸlemi sÄ±rasÄ±nda hata olduysa sessizce devam et
        console.warn(`Could not update user profile for ${userId}:`, profileError);
      }
    } catch (error: any) {
      console.error(`Error logging user interaction for user ${userId}:`, error);
      // EtkileÅŸim kaydÄ± sÄ±rasÄ±ndaki hatalar kritik deÄŸildir, sessizce devam ediyoruz
    }
  }

  /**
   * KullanÄ±cÄ±nÄ±n haftalÄ±k mÃ¼zik Ã¶zetini oluÅŸturur
   * @param userId KullanÄ±cÄ± ID'si
   * @returns HaftalÄ±k Ã¶zet bilgileri (en Ã§ok dinlenen sanatÃ§Ä±lar, tÃ¼rler, baskÄ±n ruh hali ve Ã¶nerilen ÅŸarkÄ±lar)
   */
  async generateWeeklySummary(userId: string): Promise<WeeklySummary> {
    try {
      // KullanÄ±cÄ± profilini getir
      const userProfile = await this.getUserProfile(userId);
      
      // Son bir haftalÄ±k dinleme verilerini analiz et
      // UserProfile'dan dinleme geÃ§miÅŸini al veya boÅŸ dizi kullan
      let listeningHistory: any[] = [];
      
      // EÄŸer kullanÄ±cÄ± profilinde getListeningHistory metodu varsa kullan
      if (userProfile && typeof userProfile.getListeningHistory === 'function') {
        try {
          listeningHistory = await userProfile.getListeningHistory() || [];
        } catch (e) {
          console.error('Dinleme geÃ§miÅŸi alÄ±namadÄ±:', e);
          // Devam et, boÅŸ liste kullan
        }
      }
      
      // Dinleme geÃ§miÅŸini tarih filtresine gÃ¶re filtrele
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const lastWeekListening = listeningHistory.filter((item: any) => {
        return new Date(item.timestamp) >= oneWeekAgo;
      });
      
      // En Ã§ok dinlenen sanatÃ§Ä±larÄ±, tÃ¼rleri ve ruh hallerini sayacak nesneler
      const artistCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};
      const moodCounts: Record<string, number> = {};
      
      // Dinleme geÃ§miÅŸinden sanatÃ§Ä± ve tÃ¼rleri topla
      for (const item of lastWeekListening) {
        try {
          // EÄŸer ÅŸarkÄ± detaylarÄ± zaten varsa kullan, yoksa getir
          let songDetails: any = item.songDetails;
          
          if (!songDetails && item.songId && this.musicAnalyzer) {
            songDetails = await this.musicAnalyzer.getSongDetails(item.songId);
          }
          
          if (songDetails) {
            // SanatÃ§Ä± sayacÄ±nÄ± artÄ±r
            if (songDetails.artist) {
              artistCounts[songDetails.artist] = (artistCounts[songDetails.artist] || 0) + 1;
            }
            
            // TÃ¼r sayacÄ±nÄ± artÄ±r
            if (songDetails.genre && Array.isArray(songDetails.genre)) {
              for (const genre of songDetails.genre) {
                if (typeof genre === 'string') {
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                }
              }
            }
            
            // Ruh hali sayacÄ±nÄ± artÄ±r
            if (songDetails.mood && Array.isArray(songDetails.mood)) {
              for (const mood of songDetails.mood) {
                if (typeof mood === 'string') {
                  moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                }
              }
            }
          }
        } catch (songError) {
          console.error('ÅžarkÄ± detaylarÄ± iÅŸlenirken hata:', songError);
          // Tek bir ÅŸarkÄ± hatasÄ± iÃ§in tÃ¼m iÅŸlemi kÄ±rma, devam et
          continue;
        }
      }
      
      // En Ã§ok dinlenen sanatÃ§Ä±larÄ± bul
      const topArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
      
      // En Ã§ok dinlenen tÃ¼rleri bul
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
      
      // Dominant ruh halini bul veya varsayÄ±lan kullan
      const dominantMood = Object.entries(moodCounts).length > 0 ?
        Object.entries(moodCounts)
          .sort((a, b) => b[1] - a[1])[0][0] : 
        (userProfile.preferences?.favoriteMoods?.[0] || 'mutlu');
      
      // EÄŸer dinleme geÃ§miÅŸi boÅŸsa, kullanÄ±cÄ± tercihlerinden al
      if (topArtists.length === 0 && userProfile.preferences?.favoriteArtists) {
        topArtists.push(...(userProfile.preferences.favoriteArtists.slice(0, 3)));
      }
      
      // Hala boÅŸsa varsayÄ±lan deÄŸerler ekle
      if (topArtists.length === 0) {
        topArtists.push('SanatÃ§Ä± A', 'SanatÃ§Ä± B', 'SanatÃ§Ä± C');
      }
      
      // TÃ¼r iÃ§in de benzer ÅŸekilde
      if (topGenres.length === 0 && userProfile.preferences?.favoriteGenres) {
        topGenres.push(...(userProfile.preferences.favoriteGenres.slice(0, 3)));
      }
      
      if (topGenres.length === 0) {
        topGenres.push('Pop', 'Rock', 'Jazz');
      }
      
      // KullanÄ±cÄ± iÃ§in Ã¶zel Ã¶neriler oluÅŸtur
      const recommendationParams: any = {
        userId, 
        seedGenres: topGenres,
        targetMoods: [dominantMood],
        limit: 5,
        noveltyFactor: 0.7 // %70 yenilik faktÃ¶rÃ¼ ile benzer ama yeni ÅŸarkÄ±lar Ã¶ner
      };
      
      // Ã–nerileri al
      let recommendedSongs: Song[] = [];
      try {
        recommendedSongs = await this.recommender.getRecommendations(userId, recommendationParams) || [];
      } catch (recError) {
        console.error('Ã–neri getirme hatasÄ±:', recError);
        // Hata oluÅŸtu, varsayÄ±lan Ã¶neriler oluÅŸturacaÄŸÄ±z
      }
      
      // EÄŸer Ã¶neriler boÅŸsa, varsayÄ±lan ÅŸarkÄ±lar dÃ¶ndÃ¼r
      if (!recommendedSongs || recommendedSongs.length === 0) {
        recommendedSongs = [
          {
            id: 'song1',
            title: 'HaftalÄ±k Ã–neri 1',
            artist: 'SanatÃ§Ä± X',
            album: 'AlbÃ¼m A',
            imageUrl: 'https://picsum.photos/200',
            genre: ['pop'],
            mood: ['mutlu'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'song2',
            title: 'HaftalÄ±k Ã–neri 2',
            artist: 'SanatÃ§Ä± Y',
            album: 'AlbÃ¼m B',
            imageUrl: 'https://picsum.photos/200',
            genre: ['rock'],
            mood: ['enerjik'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'song3',
            title: 'HaftalÄ±k Ã–neri 3',
            artist: 'SanatÃ§Ä± Z',
            album: 'AlbÃ¼m C',
            imageUrl: 'https://picsum.photos/200',
            genre: ['jazz'],
            mood: ['sakin'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'song4',
            title: 'HaftalÄ±k Ã–neri 4',
            artist: 'SanatÃ§Ä± A',
            album: 'AlbÃ¼m D',
            imageUrl: 'https://picsum.photos/200',
            genre: ['classical'],
            mood: ['rahatlatÄ±cÄ±'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'song5',
            title: 'HaftalÄ±k Ã–neri 5',
            artist: 'SanatÃ§Ä± B',
            album: 'AlbÃ¼m E',
            imageUrl: 'https://picsum.photos/200',
            genre: ['electronic'],
            mood: ['heyecanlÄ±'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }
      
      // SonuÃ§larÄ± dÃ¶ndÃ¼r
      return {
        topArtists,
        topGenres,
        dominantMood,
        recommendedSongs
      };
    } catch (error) {
      console.error(`Error generating weekly summary for user ${userId}:`, error);
      // Hata durumunda varsayÄ±lan deÄŸerler dÃ¶ndÃ¼r, bÃ¶ylece uygulama kÄ±rÄ±lmaz
      return {
        topArtists: ['SanatÃ§Ä± A', 'SanatÃ§Ä± B', 'SanatÃ§Ä± C'],
        topGenres: ['Pop', 'Rock', 'Jazz'],
        dominantMood: 'mutlu',
        recommendedSongs: [
          {
            id: 'error-song',
            title: 'Ã–neri OluÅŸturulamadÄ±',
            artist: 'Sistem',
            album: 'Hata Durumu',
            imageUrl: 'https://picsum.photos/200',
            genre: ['pop'],
            mood: ['neutral'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
    }
  }

  /**
   * Kullanıcının sorgusunu işler ve öneriler sunar
   * @param query Kullanıcı sorgusu
   * @param userId Kullanıcı ID'si
   */
  async processQuery(query: string, userId: string): Promise<ProcessQueryResult> {
    if (!query || !userId) {
      console.warn("GeÃ§ersiz sorgu veya kullanÄ±cÄ± ID'si alÄ±ndÄ±.");
      return {
        response: "GeÃ§ersiz sorgu veya kullanÄ±cÄ± ID'si. LÃ¼tfen tekrar deneyin.",
        songs: [],
        relatedMoods: [],
        categoryFilters: {},
        playableResults: false,
      };
    }

    try {
      // 1. KullanÄ±cÄ± profilini al
      let userProfile: UserProfile;
      try {
        userProfile = await this.getUserProfile(userId);
        
        // EtkileÅŸimi kaydet
        try {
          await this.logUserInteraction(userId, {
            type: 'query',
            query: query,
            timestamp: new Date(),
            successful: true
          });
        } catch (e) {
          console.error('EtkileÅŸim kaydedilemedi', e);
        }
      } catch (logError) {
        console.error('KullanÄ±cÄ± etkileÅŸimi kaydedilemedi:', logError);
        // Kritik bir hata deÄŸil, devam ediyoruz
        userProfile = await this.getUserProfile(userId); // Tekrar almayÄ± dene
      }
      
      // 2. KullanÄ±cÄ±nÄ±n sorgusunu analiz et (NLP)
      if (!this.nlpProcessor) {
        throw new Error('NLP iÅŸlemcisi baÅŸlatÄ±lmamÄ±ÅŸ');
      }
      const queryAnalysis = await this.nlpProcessor.analyzeQuery(query);
      
      // 3. KullanÄ±cÄ± baÄŸlamÄ±nÄ± al
      if (!this.contextManager) {
        throw new Error('BaÄŸlam yÃ¶neticisi baÅŸlatÄ±lmamÄ±ÅŸ');
      }
      // BaÄŸlam bilgisini al (gÃ¼ncelleme sÄ±rasÄ±nda kullanÄ±lmÄ±yor, ama ileride kullanÄ±labilir)
      await this.contextManager.getContext(userId);
      
      // 4. Duygu analizi yap
      if (!this.emotionDetector) {
        throw new Error('Duygu algÄ±layÄ±cÄ±sÄ± baÅŸlatÄ±lmamÄ±ÅŸ');
      }
      const moodAnalysis = await this.emotionDetector.analyzeText(query);
      const relatedMoods: string[] = [];
      
      // BaskÄ±n duyguyu ekle
      if (moodAnalysis && moodAnalysis.dominantEmotion) {
        relatedMoods.push(moodAnalysis.dominantEmotion);
      }
      
      // Ruh hali puanlarÄ±ndan yÃ¼ksek olanlarÄ± ekle (eÅŸik: 0.5)
      if (moodAnalysis && moodAnalysis.emotionScores) {
        Object.entries(moodAnalysis.emotionScores).forEach(([emotion, score]) => {
          if (score > 0.5 && emotion !== moodAnalysis.dominantEmotion) {
            relatedMoods.push(emotion);
          }
        });
      }
      
      // Ã–neri parametrelerini oluÅŸtur
      const recommendationParams: RecommendationParameters = {
        userId,
        limit: 10,
        seedGenres: queryAnalysis && queryAnalysis.entities && queryAnalysis.entities.genres ? queryAnalysis.entities.genres : [],
        targetMoods: relatedMoods,
        noveltyFactor: 0.3 // %30 yenilik faktÃ¶rÃ¼
      };
      
      // Sorgu analizine ve kullanÄ±cÄ± baÄŸlamÄ±na gÃ¶re tavsiye al - gerekli kontroller eklendi
      if (!this.recommender) {
        throw new Error('Tavsiye motoru baÅŸlatÄ±lmamÄ±ÅŸ');
      }
      const recommendations = await this.recommender.getRecommendations(userId, recommendationParams);
      
      // Kategori filtrelerini hazÄ±rla
      const categoryFilters = {
        genres: queryAnalysis.entities?.genres || [],
        moods: relatedMoods,
        eras: queryAnalysis.entities?.eras || [],
        regions: queryAnalysis.entities?.locations || []
      };
      
      // YanÄ±t metni oluÅŸtur
      let responseText = "";
      
      // Niyet (intent) bazlÄ± yanÄ±t oluÅŸturma
      if (queryAnalysis.intent === "recommendation") {
        if (relatedMoods.length > 0) {
          responseText = `${relatedMoods.join(", ")} hislerinize uygun ÅŸarkÄ±lar buldum:`;
        } else {
          responseText = "Ä°ÅŸte sizin iÃ§in Ã¶nerdiÄŸim ÅŸarkÄ±lar:";
        }
      } else if (queryAnalysis.intent === "search") {
        responseText = "AramanÄ±za uygun ÅŸarkÄ±lar buldum:";
      } else if (queryAnalysis.intent === "information") {
        responseText = "Ä°ÅŸte istediÄŸiniz bilgiler:";
      } else if (queryAnalysis.intent === "play") {
        responseText = "Åžu ÅŸarkÄ±larÄ± Ã§alabilirim:";
      } else {
        responseText = "NasÄ±l yardÄ±mcÄ± olabilirim? Belirli bir ruh haline gÃ¶re mÃ¼zik Ã¶nerileri iÃ§in 'enerjik', 'sakin', 'hÃ¼zÃ¼nlÃ¼' veya 'mutlu' gibi terimler kullanabilirsiniz.";
      }
      
      // Ã–ÄŸrenme motorunu besle - kullanÄ±cÄ± profilini geliÅŸtir
      try {
        if (this.learningEngine && userProfile) {
          await this.learningEngine.learnFromQuery(userProfile, query, recommendations);
          
          // KullanÄ±cÄ± profilini kaydet
          if (typeof userProfile.save === 'function') {
            await userProfile.save();
          }
        }
      } catch (learningError) {
        console.error('Ã–ÄŸrenme iÅŸlemi sÄ±rasÄ±nda hata:', learningError);
      }
      
      // ÅžarkÄ±larÄ±n oynatÄ±labilir olup olmadÄ±ÄŸÄ±nÄ± kontrol et
      // Bu bilgi UI'da doÄŸrudan oynat butonlarÄ± gÃ¶stermek iÃ§in kullanÄ±lacak
      // YouTube entegrasyonu: Bulunan ÅŸarkÄ±larÄ±n Ã§alÄ±nabilir olup olmadÄ±ÄŸÄ±nÄ± iÅŸaretle
      const hasPlayableResults = recommendations && recommendations.length > 0;
      
      // KullanÄ±cÄ± etkileÅŸimini kaydet
      await this.logUserInteraction(userId, {
        type: 'query',
        timestamp: new Date(),
        details: { queryText: query, recommendedCount: recommendations?.length || 0 }
      });
      
      // Cevap oluÅŸturma iÅŸlemini tamamla
      return {
        response: responseText,
        songs: recommendations,
        relatedMoods,
        categoryFilters,
        playableResults: hasPlayableResults // YouTube entegrasyonu ile ilgili bilgi
      };
    } catch (error: any) {
      console.error("Sorgu iÅŸleme hatasÄ±:", error);
      
      // Hata durumunda basit bir yanÄ±t dÃ¶ndÃ¼r
      if (!query || !userId) {
        return {
          response: "GeÃ§ersiz sorgu veya kullanÄ±cÄ± ID'si. LÃ¼tfen tekrar deneyin.",
          songs: [],
          relatedMoods: [],
          categoryFilters: {},
          playableResults: false
        };
      } else {
        return {
          response: `Sorgunuzu iÅŸlerken bir sorun oluÅŸtu: ${error?.message || 'Bilinmeyen hata'}. LÃ¼tfen tekrar deneyin.`,
          songs: [],
          relatedMoods: [],
          categoryFilters: {},
          playableResults: false
        };
      }
    }
  }





}


// Yapay zeka motorunu oluÅŸturmak iÃ§in yardÄ±mcÄ± fonksiyon
let aiInstance: EnhancedMusicAI | null = null;

export function getEnhancedMusicAI(): EnhancedMusicAI {
  if (!aiInstance) {
    aiInstance = new EnhancedMusicAI();
  }
  return aiInstance;
}
