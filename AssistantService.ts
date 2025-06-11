
// Intents Marjinal Asistan can understand
// Removed duplicate numeric enum; string enum below is used.

import axios from 'axios';
import { Song } from '../../../../shared/schema';

// Entities that can be extracted from a user's message
export enum Intent {
  UNKNOWN = 'UNKNOWN',
  PLAY_SONG = 'PLAY_SONG',
  PLAY_ARTIST_MUSIC = 'PLAY_ARTIST_MUSIC',
  GET_RECOMMENDATIONS_MOOD = 'GET_RECOMMENDATIONS_MOOD',
  ASK_ASSISTANT_CAPABILITIES = 'ASK_ASSISTANT_CAPABILITIES',
  GREETING = 'GREETING',
  HOW_ARE_YOU = 'HOW_ARE_YOU',
  PLAY_MORE_FROM_LAST_ARTIST = 'PLAY_MORE_FROM_LAST_ARTIST',
  STOP_MUSIC = 'STOP_MUSIC',
  WHAT_IS_PLAYING = 'WHAT_IS_PLAYING',
  SET_VOLUME = 'SET_VOLUME',
  RECOMMEND_SONG = 'RECOMMEND_SONG', // New intent for general recommendations
  // Add other intents as needed
}

export interface ExtractedEntities {
  songName?: string;
  artistName?: string;
  mood?: string;
  genre?: string; // Added genre entity
  volumeLevel?: number | 'increase' | 'decrease'; // For volume control
  // any other relevant entities
}

// Structure to hold the recognized intent and its entities
export interface RecognizedIntent {
  intent: Intent;
  entities: ExtractedEntities;
  originalMessage: string;
}

// Updated AssistantAction to be more generic
export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  popularity?: number;
}

export interface AssistantAction {
  type: Intent;
  payload?: ExtractedEntities | string | number | Song[]; // Generic payload for various actions, now includes Song[]
  // Optional: keep specific fields if they are frequently accessed directly and clearly defined
  // query?: string; 
  // mood?: string;
  // artistName?: string;
  // volumeLevel?: number | 'increase' | 'decrease';
}

// Updated AssistantResponse
export interface AssistantResponse {
  text: string; // Changed from textResponse, non-optional
  action?: AssistantAction;
  originalQuery?: string;
  sentiment?: string; // Assuming this might be added from HF results
}

const HF_API_URL_BASE = "https://api-inference.huggingface.co/models/";
const DEFAULT_HF_MODEL_FOR_INTENT = "dbmdz/bert-base-turkish-cased"; // Using a general Turkish BERT model for now, might need a specific fine-tuned model for intent classification/generation
const HF_SENTIMENT_MODEL_TR = "emre/turkish-sentiment-analysis"; // Changed based on memory and to fix 404
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const spotifyClientCredentialsToken = import.meta.env.VITE_SPOTIFY_CC_TOKEN;

export class AssistantService {
  // Spotify Helper Methods
  private async getSpotifyApiHeaders() {
    if (!spotifyClientCredentialsToken) {
      console.error(
        'Spotify Client Credentials Token bulunamadı. Lütfen client/.env dosyasını kontrol edin (VITE_SPOTIFY_CC_TOKEN).'
      );
      throw new Error('Spotify API token eksik.');
    }
    return {
      Authorization: `Bearer ${spotifyClientCredentialsToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async getArtistIdByName(artistName: string): Promise<string | null> {
    try {
      const headers = await this.getSpotifyApiHeaders();
      const response = await axios.get<{ artists: { items: SpotifyArtist[] } }>(
        `${SPOTIFY_API_BASE_URL}/search`,
        {
          headers,
          params: {
            q: artistName,
            type: 'artist',
            limit: 3, // Arama limitini 3'e çıkardık
          },
        }
      );

      if (response.data.artists && response.data.artists.items.length > 0) {
        // İlk olarak tam eşleşme arayalım (büyük/küçük harf duyarlı)
        const exactMatch = response.data.artists.items.find(artist => artist.name === artistName);
        if (exactMatch) {
          return exactMatch.id;
        }

        // Sonra büyük/küçük harf duyarsız eşleşme arayalım
        const caseInsensitiveMatch = response.data.artists.items.find(artist => artist.name.toLowerCase() === artistName.toLowerCase());
        if (caseInsensitiveMatch) {
          return caseInsensitiveMatch.id;
        }

        // Eğer tam veya duyarsız eşleşme yoksa, ilk sonucu (en alakalı olduğunu varsaydığımız) döndürelim
        // Daha gelişmiş bir benzerlik algoritması (örn: Levenshtein) burada kullanılabilir
        console.warn(`Spotify'da "${artistName}" için tam eşleşme bulunamadı, ilk sonuç kullanılıyor: ${response.data.artists.items[0].name}`);
        return response.data.artists.items[0].id;
      }
      console.warn(`Spotify'da "${artistName}" sanatçısı bulunamadı.`);
      return null;
    } catch (error) {
      console.error(`Spotify'da sanatçı aranırken hata (${artistName}):`, error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error("Spotify API token geçersiz veya süresi dolmuş olabilir. Lütfen VITE_SPOTIFY_CC_TOKEN'ı güncelleyin.");
      }
      return null;
    }
  }

  private async getArtistTopTracks(artistId: string, limit: number = 3): Promise<Song[]> {
    try {
      const headers = await this.getSpotifyApiHeaders();
      const market = 'TR'; // Pazar parametresi, Türkiye için ayarlandı
      const response = await axios.get<{ tracks: SpotifyTrack[] }>(
        `${SPOTIFY_API_BASE_URL}/artists/${artistId}/top-tracks`,
        {
          headers,
          params: {
            market: market,
          },
        }
      );

      if (response.data.tracks) {
        return response.data.tracks.slice(0, limit).map((track: SpotifyTrack) => ({
          id: track.id,
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          imageUrl: track.album.images?.[0]?.url,
          previewUrl: track.preview_url,
          spotifyId: track.id,
          spotifyUrl: track.external_urls.spotify,
          duration: track.duration_ms,
          popularity: track.popularity,
          // Song arayüzündeki zorunlu alanlar için varsayılan değerler:
          createdAt: new Date(), 
          updatedAt: new Date(),
          // Diğer alanlar (genre, moods vb.) bu çağrıdan gelmez, gerekirse ek mantıkla doldurulabilir.
        }));
      }
      return [];
    } catch (error) {
      console.error(`Spotify'da sanatçının popüler şarkıları alınırken hata (ID: ${artistId}):`, error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error("Spotify API token geçersiz veya süresi dolmuş olabilir. Lütfen VITE_SPOTIFY_CC_TOKEN'ı güncelleyin.");
      }
      return [];
    }
  }

  public async recommendSongsByArtist(artistName: string): Promise<Song[]> {
    console.log(`"${artistName}" için şarkı önerileri hazırlanıyor...`);
    const artistId = await this.getArtistIdByName(artistName);

    if (artistId) {
      console.log(`"${artistName}" için Spotify Sanatçı ID'si bulundu: ${artistId}`);
      const songs = await this.getArtistTopTracks(artistId, 3);
      if (songs.length > 0) {
        console.log(`"${artistName}" için ${songs.length} şarkı önerisi bulundu:`, songs.map(s => s.title));
      } else {
        console.log(`"${artistName}" için popüler şarkı bulunamadı veya API hatası.`);
      }
      return songs;
    } else {
      console.log(`"${artistName}" adında bir sanatçı Spotify'da bulunamadı.`);
      return [];
    }
  }

  private static instance: AssistantService;
  private lastProcessedArtist: string | null = null;
  private hfApiToken: string | null = null;
  private conversationHistory: Array<{ user: string, assistant: string, timestamp: Date }> = [];

  private unknownResponses: string[] = [
    "Hmm, o ne demek yahu? Daha net olsan diyorum?",
    "Kafam basmadı buna, başka türlü söylesen?",
    "Anlayamadım desem yeridir. Tekrar eder misin cancağızım?",
    "Bu dediğin benim lügatta yok, başka bir şey dene istersen?",
    "Marjinal zekam bile bunu çözemedi, farklı bir komut alayım."
  ];

  private capabilitiesResponses: string[] = [
    "Neler mi yaparım? Şarkı çalarım, sanatçıdan müzik çalarım, ruh haline göre takılırım, seninle iki lafın belini kırarım. Kısaca, müzik ve muhabbet bende!",
    "Ben Marjinal Asistan! Senin için müzik dünyasının altını üstüne getiririm. Şarkı iste, sanatçı söyle, modunu belirt, gerisini bana bırak.",
    "Marifetlerim saymakla bitmez ama en iyisi müzik konusundaki yeteneklerimdir. İstek yap, keyfine bak!",
    "Ben senin dijital müzik yoldaşınım. Şarkılar, sanatçılar, ruh halleri... Hepsi benim uzmanlık alanım. Söyle bakalım ne istersin?"
  ];

  private moodKeywords: { [key: string]: string[] } = {
    'neşeli': ['neşeli', 'mutlu', 'keyifli', 'pozitif'],
    'hüzünlü': ['hüzünlü', 'üzgün', 'efkarlı', 'melankolik'],
    'enerjik': ['enerjik', 'hareketli', 'canlı', 'coşkulu', 'gaz'],
    'sakin': ['sakin', 'dingin', 'huzurlu', 'rahatlatıcı', 'yavaş'],
    'romantik': ['romantik', 'aşk', 'duygusal', 'sevgili']
  };

  private greetingResponses: string[] = [
    'Selam Marjinal! Müzik dünyasının derinliklerine bir yolculuğa ne dersin?',
    'Hey! Ben Marjinal Asistan, frekansını yakalamaya geldim. Ne çalıyoruz?',
    'Merhaba! Senin gibi bir müzik gurmesiyle tanışmak bir şereftir. Bugün hangi notalarda kaybolmak istersin?',
    'Naber? Ortamı biraz hareketlendirecek bir şeyler mi arıyorsun, yoksa kafa dinlemelik mi?'
  ];

  private howAreYouResponses: string[] = [
    'Bomba gibiyim! Yeni şarkılar keşfetmek için sabırsızlanıyorum. Senin modun nasıl?',
    'Harika hissediyorum, özellikle de kaliteli müzik konuşacaksak! Sen nasılsın?',
    'Keyfim yerinde, Marjinal! Senin için en iyi şarkıları bulmaya hazırım. İstekler?',
    'Müzik kadar iyiyim! Yani oldukça iyiyim. Senin için ne yapabilirim?'
  ];

  private constructor(hfApiToken?: string) {
    this.hfApiToken = hfApiToken || null;
    if (hfApiToken) {
      console.log("AssistantService initialized with Hugging Face API support.");
    } else {
      console.log("AssistantService initialized WITHOUT Hugging Face API support (no token provided).");
    }
  }

  public static getInstance(hfApiToken?: string): AssistantService {
    if (!AssistantService.instance) {
      // IMPORTANT: In a real app, get YOUR_HF_API_TOKEN_REPLACE_ME from a secure source (e.g., env variables)
      // For this example, we'll allow it to be passed or use a placeholder if you configure it elsewhere.
      // Passing it here for demonstration if the user provides one upon instantiation.
      const tokenToUse = hfApiToken || (process.env.REACT_APP_HF_API_TOKEN || 'YOUR_HF_API_TOKEN_REPLACE_ME'); 
      AssistantService.instance = new AssistantService(tokenToUse !== 'YOUR_HF_API_TOKEN_REPLACE_ME' ? tokenToUse : undefined);
    }
    return AssistantService.instance;
  }

  /**
   * Processes a user's message and returns an assistant response.
   * This is the main entry point for interacting with the AI assistant.
   * @param message The user's input message.
   * @returns A promise that resolves to an AssistantResponse object.
   */
  public async processMessage(message: string): Promise<AssistantResponse> {
    console.log(`Marjinal Asistan processing message: "${message}"`);

    // Initialize with rule-based extraction as a baseline/fallback
    const recognizedRuleBased = this._extractIntentAndEntities(message);
    let finalIntent: Intent = recognizedRuleBased.intent;
    let finalEntities: ExtractedEntities = recognizedRuleBased.entities;
    let sentiment: string | null = null;

    // Attempt to use Hugging Face API if available and for relevant intents
    if (this.hfApiToken) {
      console.log(`Initial rule-based NLP result: ${Intent[finalIntent]}. Trying Hugging Face API for potential enhancement or clarification...`);
      try {
        sentiment = await this._getSentimentHF(message);
        console.log("HF Sentiment: ", sentiment);

        const hfAnalysis = await this._extractIntentAndEntitiesHF(message, sentiment);
        if (hfAnalysis) {
          console.log("HF Analysis successful: ", hfAnalysis);
          // Prefer HF results if they provide a more specific intent or richer entities
          if (hfAnalysis.intent !== Intent.UNKNOWN) {
            finalIntent = hfAnalysis.intent;
            // Merge entities: HF can add new ones or refine existing ones.
            // Simple strategy: HF entities override rule-based ones if keys conflict.
            finalEntities = { ...finalEntities, ...hfAnalysis.entities }; 
          } else if (Object.keys(hfAnalysis.entities).length > Object.keys(finalEntities).length) {
            // If intent is still UNKNOWN but HF gave more entities, use them
            finalEntities = { ...finalEntities, ...hfAnalysis.entities };
          }
        } else {
          console.log("HF Analysis did not yield a usable result. Sticking with rule-based or previous HF sentiment.");
        }
      } catch (error) {
        console.error("Error during Hugging Face processing pipeline: ", error, "Falling back to rule-based intent/entities.");
        // Fallback to rule-based if HF pipeline errors, sentiment might still be from HF if that part succeeded
        finalIntent = recognizedRuleBased.intent; // Re-assert rule-based intent
        finalEntities = recognizedRuleBased.entities; // Re-assert rule-based entities
      }
    } else {
      console.log("Hugging Face API token not configured. Using rule-based NLU only.");
    }

    console.log('Final Intent:', Intent[finalIntent], 'Final Entities:', finalEntities);
    
    // Update last processed artist if relevant intent and entity exist
    if (finalEntities.artistName && 
        (finalIntent === Intent.PLAY_ARTIST_MUSIC || 
         finalIntent === Intent.RECOMMEND_SONG || 
         finalIntent === Intent.PLAY_SONG)) {
        this.lastProcessedArtist = finalEntities.artistName;
    }

    // Delegate to _handleIntent for response generation and actions
    const assistantResponse = await this._handleIntent(finalIntent, finalEntities, message, sentiment);
    
    this.conversationHistory.push({
      user: message,
      assistant: assistantResponse.text,
      timestamp: new Date(),
    });
    console.log("Final Assistant Response:", assistantResponse);
    return assistantResponse;
  }

  private async _handleIntent(intent: Intent, entities: ExtractedEntities, originalQuery: string, sentiment: string | null): Promise<AssistantResponse> {
    let responseText = `Üzgünüm, "${originalQuery}" komutunu tam olarak anlayamadım. Lütfen farklı bir şekilde ifade etmeyi dene.`; // Default fallback text
    let actionPayload: ExtractedEntities | string | number | Song[] | undefined = entities;
    let currentAction: AssistantAction | undefined;

    switch (intent) {
      case Intent.GREETING:
        responseText = this.greetingResponses[Math.floor(Math.random() * this.greetingResponses.length)];
        actionPayload = {};
        break;

      case Intent.HOW_ARE_YOU:
        responseText = this.howAreYouResponses[Math.floor(Math.random() * this.howAreYouResponses.length)];
        actionPayload = {};
        break;

      case Intent.ASK_ASSISTANT_CAPABILITIES:
        responseText = this.capabilitiesResponses[Math.floor(Math.random() * this.capabilitiesResponses.length)];
        actionPayload = {};
        break;

      case Intent.RECOMMEND_SONG:
        if (entities.artistName) {
          try {
            console.log(`_handleIntent: Recommending songs for artist: ${entities.artistName}`);
            const songs = await this.recommendSongsByArtist(entities.artistName);
            if (songs.length > 0) {
              actionPayload = songs; 
              const songListText = songs.map((song, index) => `${index + 1}. ${song.title} - ${song.artist}`).join('\n');
              responseText = `İşte sana "${entities.artistName}" sanatçısından bazı şarkı önerileri:\n${songListText}\nUmarım beğenirsin!`;
            } else {
              responseText = `"${entities.artistName}" sanatçısından şu anda şarkı bulamadım. Başka bir sanatçı denemek ister misin?`;
              actionPayload = []; 
            }
          } catch (error) {
            console.error(`Error in _handleIntent for RECOMMEND_SONG (artist: ${entities.artistName}):`, error);
            responseText = "Şarkı önerileri getirilirken bir sorun oluştu. Lütfen daha sonra tekrar dene.";
            actionPayload = []; 
          }
        } else {
          responseText = "Hangi sanatçıdan şarkı önerisi istersin? Veya genel bir öneri mi istersin? (Örn: 'Sezen Aksu'dan şarkı öner' veya 'bana bir şarkı öner')";
          actionPayload = {}; 
        }
        break;

      case Intent.PLAY_SONG:
        if (entities.songName && entities.artistName) {
          responseText = `"${entities.artistName}" sanatçısının "${entities.songName}" adlı şarkısı için çalma işlemi başlatılıyor...`;
        } else if (entities.songName) {
          responseText = `"${entities.songName}" için çalma işlemi başlatılıyor...`;
        } else {
          responseText = "Hangi şarkıyı çalmamı istersin?";
        }
        actionPayload = entities;
        break;

      case Intent.PLAY_ARTIST_MUSIC:
        if (entities.artistName) {
          responseText = `"${entities.artistName}" sanatçısından müzikler çalınıyor...`;
        } else {
          responseText = "Hangi sanatçının müziklerini çalmamı istersin?";
        }
        actionPayload = entities;
        break;

      case Intent.PLAY_MORE_FROM_LAST_ARTIST:
        if (this.lastProcessedArtist) {
            responseText = `${this.lastProcessedArtist} sanatçısından daha fazla şarkı geliyor...`;
            actionPayload = { artistName: this.lastProcessedArtist }; 
        } else {
            responseText = "Daha önce bir sanatçı çalmadık ki... Önce bir şeyler dinleyelim, sonra bakarız.";
            actionPayload = {};
        }
        break;
      
      case Intent.STOP_MUSIC:
        responseText = "Müzik durduruluyor...";
        actionPayload = {};
        break;

      case Intent.WHAT_IS_PLAYING:
        // This would typically require state from the player
        responseText = "Şu an ne çaldığını kontrol ediyorum... (Bu özellik henüz tam entegre değil)";
        actionPayload = {};
        break;

      case Intent.SET_VOLUME:
        if (entities.volumeLevel !== undefined) {
          responseText = `Ses seviyesi ayarlanıyor: ${entities.volumeLevel}`;
        } else {
          responseText = "Ses seviyesini nasıl ayarlamamı istersin?";
        }
        actionPayload = entities;
        break;
        
      case Intent.GET_RECOMMENDATIONS_MOOD:
        if (entities.mood) {
          responseText = `${entities.mood} moduna uygun şarkılar aranıyor...`;
          // Potentially add genre if available: if (entities.genre) responseText += ` (${entities.genre} türünde)`;
        } else {
          responseText = "Hangi ruh haline göre şarkı önerisi istersin?";
        }
        actionPayload = entities;
        break;

      case Intent.UNKNOWN:
        responseText = this.unknownResponses[Math.floor(Math.random() * this.unknownResponses.length)];
        if (Object.keys(entities).length > 0) {
          responseText += ` Algılananlar: ${JSON.stringify(entities)}.`;
        }
        actionPayload = entities;
        break;

      default:
        // For any other intents not explicitly handled with custom text but recognized by rule-based NLU
        responseText = `Niyetini anladım: ${Intent[intent]}.`;
        if (Object.keys(entities).length > 0) {
          responseText += ` Algılananlar: ${JSON.stringify(entities)}.`;
        }
        actionPayload = entities; // Keep original entities
        break;
    }

    currentAction = {
      type: intent,
      payload: actionPayload,
    };

    return {
      text: responseText,
      action: currentAction,
      originalQuery: originalQuery,
      sentiment: sentiment === null ? undefined : sentiment,
    };
  }

  private _extractIntentAndEntities(message: string): RecognizedIntent {
    const lowerMessage = message.toLowerCase();
    let intent: Intent = Intent.UNKNOWN;
    let entities: ExtractedEntities = {};

    // Priority for intents: More specific regexes should come first.

    // Intent: PLAY_SONG (specific song, possibly with artist)
    const playSongRegexComplex = /(?:çal|oynat|dinlet|aç)\\s+(?:bana\\s+)?(.+?)(?:\\s+(?:adlı|isimli)\\s+(?:şarkısını|parçasını|şarkıyı|parçayı))?(?:\\s+(?:kimden|sanatçısından|söyleyen|ait)\\s+(.+))?$/i;
    const playMatchComplex = message.match(playSongRegexComplex);
    if (playMatchComplex) {
      const potentialSong = playMatchComplex[1]?.trim();
      const potentialArtist = playMatchComplex[2]?.trim();
      if (!(potentialSong.includes('bir şeyler') || potentialSong.includes('müzik') || potentialSong.includes('şarkılar')) || potentialArtist) {
        intent = Intent.PLAY_SONG;
        entities.songName = potentialSong;
        if (potentialArtist) {
          entities.artistName = potentialArtist;
        }
      }
    }
    
    // Intent: PLAY_ARTIST_MUSIC (general music from an artist)
    else if (intent === Intent.UNKNOWN) { 
      const playArtistRegex1 = /(?:çal|oynat|dinlet|aç)\\s+(?:bana\\s+)?(?:bir şeyler|bir şarkı|müzik|şarkılar)\\s+(?:kimden|sanatçısından|söyleyen|ait)\\s+(.+?)(?:\\s+olsun|\\?)?$/i;
      const playArtistMatch1 = message.match(playArtistRegex1);
      if (playArtistMatch1) {
        intent = Intent.PLAY_ARTIST_MUSIC;
        entities.artistName = playArtistMatch1[1]?.trim();
      } else {
        const playArtistRegex2 = /(?:çal|oynat|dinlet|aç)\\s+(.+?)(?:'den|'dan|'ten|'tan)\\s+(?:bir şeyler|bir şarkı|müzik|şarkılar)/i;
        const playArtistMatch2 = message.match(playArtistRegex2);
        if (playArtistMatch2) {
          intent = Intent.PLAY_ARTIST_MUSIC;
          entities.artistName = playArtistMatch2[1]?.trim();
        }
      }
      if (intent === Intent.UNKNOWN && (lowerMessage.startsWith('çal ') || lowerMessage.startsWith('oynat ') || lowerMessage.startsWith('dinlet '))) {
        const potentialArtistOnly = message.substring(lowerMessage.indexOf(' ') + 1).trim();
        if (potentialArtistOnly && !potentialArtistOnly.includes(' ') && potentialArtistOnly.length > 1) {
          const isLikelyGenericOrSong = /^(?:bir|şu|o|bu|ne|bana|sana|ona)\\s|şarkı|parça|müzik|şeyler|liste|albüm|hepsi|tümü/i.test(potentialArtistOnly);
          if (!isLikelyGenericOrSong) {
            intent = Intent.PLAY_ARTIST_MUSIC;
            entities.artistName = potentialArtistOnly;
          } else if (!entities.songName) { 
            intent = Intent.PLAY_SONG; 
            entities.songName = potentialArtistOnly; 
          }
        }
      }
    }

    // Correct misidentified PLAY_SONG as PLAY_ARTIST_MUSIC if 'bir şeyler' etc. is in songName part of 'artist'dan bir şeyler'
    if (intent === Intent.PLAY_SONG && entities.songName && !entities.artistName &&
      (entities.songName.toLowerCase().includes('bir şeyler') || entities.songName.toLowerCase().includes('müzik') || entities.songName.toLowerCase().includes('şarkılar'))) {
      const parts = entities.songName.split(/(?:'den|'dan|'ten|'tan)/i);
      if (parts.length > 1 && (parts[1].trim().includes('bir şeyler') || parts[1].trim().includes('müzik') || parts[1].trim().includes('şarkılar'))) {
        intent = Intent.PLAY_ARTIST_MUSIC;
        entities.artistName = parts[0].trim();
        delete entities.songName; // Remove the generic phrase from songName
      }
    }
    
    // Intent: RECOMMEND_SONG (general or by artist)
    if (intent === Intent.UNKNOWN) {
      const recommendSongRegex = /(?:bana\\s+)?(.+?)(?:\\s*(?:sanatçısından|'den|'dan|'ten|'tan))?\\s*(?:şarkı|müzik|parça)?\\s*(?:öner|tavsiye et|söyle|bul|getir|ver|önerir misin|söyler misin|bulur musun|getirir misin|verir misin)/i;
      const recommendMatch = message.match(recommendSongRegex);
      if (recommendMatch) {
        intent = Intent.RECOMMEND_SONG; 
        if (recommendMatch[1]) {
            const potentialArtistOrSubject = recommendMatch[1].trim();
            // Avoid capturing just 'şarkı' or 'müzik' as artist if it's the only thing before 'öner'
            const isJustAction = /^(?:şarkı|müzik|parça)$/i.test(potentialArtistOrSubject);
            if (!isJustAction && potentialArtistOrSubject.length > 1 && potentialArtistOrSubject.length < 50) {
                // Avoid capturing generic request phrases like 'bir', 'bana' as artist
                const isGenericRequestPhrase = /^(bir|bana|bize|herhangi bir)$/i.test(potentialArtistOrSubject);
                if (!isGenericRequestPhrase) {
                    entities.artistName = potentialArtistOrSubject;
                }
            }
        }
      }
    }

    // Intent: GET_RECOMMENDATIONS_MOOD (mood-based recommendations)
    if (intent === Intent.UNKNOWN && (lowerMessage.includes('moduna göre') || lowerMessage.includes('ruh halime göre') || Object.values(this.moodKeywords).flat().some(keyword => lowerMessage.includes(keyword)))) {
      intent = Intent.GET_RECOMMENDATIONS_MOOD;
      for (const mood in this.moodKeywords) {
        if (this.moodKeywords[mood as keyof typeof this.moodKeywords].some(keyword => lowerMessage.includes(keyword))) {
          entities.mood = mood;
          break;
        }
      }
    }

    // Intent: ASK_ASSISTANT_CAPABILITIES
    if (intent === Intent.UNKNOWN && (lowerMessage.includes('neler yapabilirsin') || lowerMessage.includes('ne işe yararsın') || lowerMessage.includes('yeteneğin ne') || lowerMessage.includes('kabiliyetlerin') || lowerMessage.includes('marifetlerin') || lowerMessage.includes('özelliklerin ne'))) {
      intent = Intent.ASK_ASSISTANT_CAPABILITIES;
    }

    // Intent: GREETING
    if (intent === Intent.UNKNOWN && (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hey') || lowerMessage.includes('naber'))) {
      intent = Intent.GREETING;
    }
    // Intent: HOW_ARE_YOU
    else if (intent === Intent.UNKNOWN && (lowerMessage.includes('nasılsın') || lowerMessage.includes('iyi misin') || lowerMessage.includes('keyfin nasıl'))) {
      intent = Intent.HOW_ARE_YOU;
    }

    // Intent: PLAY_MORE_FROM_LAST_ARTIST
    if (intent === Intent.UNKNOWN) {
        const playMoreRegex = /(?:(ondan|bu sanatçıdan|aynı sanatçıdan|kendisinden)\\s+(?:daha fazla|bir tane daha|başka bir|birkaç tane daha|devam et)\\s*(?:şarkı|müzik)?\\s*çal|(?:çal|oynat)\\s+(?:ondan|bu sanatçıdan|aynı sanatçıdan|kendisinden)\\s*(?:daha fazla|bir tane daha|başka bir|birkaç tane daha)|(?:aynı|o)\\s+sanatçıdan\\s+devam\\s*et)/i;
        if (playMoreRegex.test(lowerMessage)) {
            intent = Intent.PLAY_MORE_FROM_LAST_ARTIST;
        }
    }

    // Intent: STOP_MUSIC
    if (intent === Intent.UNKNOWN) {
        const stopMusicRegex = /(?:müziği\\s+)?(durdur|duraklat|kes|kapat)/i;
        if (stopMusicRegex.test(lowerMessage)) {
            intent = Intent.STOP_MUSIC;
        }
    }

    // Intent: WHAT_IS_PLAYING
    if (intent === Intent.UNKNOWN) {
        const whatIsPlayingRegex = /(ne çalıyor|şu an ne çalıyor|çalan şarkı ne|bu şarkı ne|hangi şarkı çalıyor)/i;
        if (whatIsPlayingRegex.test(lowerMessage)) {
            intent = Intent.WHAT_IS_PLAYING;
        }
    }
    
    // Intent: SET_VOLUME
    if (intent === Intent.UNKNOWN) {
        const volumeRegex = /(?:sesi|sesini|ses düzeyini)\\s*(?:(\\d{1,3})\\s*(?:%|yüzde|seviyesine)?\\s*(?:ayarla|yap|getir|çıkar|indir)?|(aç|artır|yükselt)|(kıs|azalt|düşür))/i;
        const volumeMatch = message.match(volumeRegex);
        if (volumeMatch) {
            intent = Intent.SET_VOLUME;
            if (volumeMatch[1]) { // Explicit level e.g. "sesi 50 yap"
                const level = parseInt(volumeMatch[1], 10);
                if (level >= 0 && level <= 100) {
                    entities.volumeLevel = level;
                }
            } else if (volumeMatch[2]) { // Increase e.g. "sesi aç"
                entities.volumeLevel = 'increase';
            } else if (volumeMatch[3]) { // Decrease e.g. "sesi kıs"
                entities.volumeLevel = 'decrease';
            }
        }
    }

    // If after all specific checks, intent is still PLAY_SONG but songName is generic and artistName is present, it's likely PLAY_ARTIST_MUSIC
    if (intent === Intent.PLAY_SONG && entities.songName && entities.artistName && 
        (entities.songName.toLowerCase().includes('bir şeyler') || 
         entities.songName.toLowerCase().includes('müzik') || 
         entities.songName.toLowerCase().includes('şarkılar') ||
         entities.songName.toLowerCase().includes('bir şarkı'))
    ) {
        intent = Intent.PLAY_ARTIST_MUSIC;
    }

    if (intent === Intent.PLAY_SONG && entities.artistName) {
      this.lastProcessedArtist = entities.artistName;
    } else if (intent === Intent.PLAY_ARTIST_MUSIC && entities.artistName) {
      this.lastProcessedArtist = entities.artistName;
    }

    return { intent, entities, originalMessage: message };
  }

  private async _callHuggingFaceApi(model: string, inputs: string, task: string): Promise<any> {
    const endpoint = `${HF_API_URL_BASE}${model}`;
    const payload = task === 'text-generation' ? { inputs, parameters: { return_full_text: false, max_new_tokens: 150 } } : { inputs };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Hugging Face API error for model ${model}: ${response.status} ${response.statusText}`, errorBody);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`Error calling Hugging Face API for model ${model}:`, error);
      return null;
    }
  }

  private async _getSentimentHF(text: string): Promise<string | null> {
    const result = await this._callHuggingFaceApi(HF_SENTIMENT_MODEL_TR, text, 'text-classification');
    if (result && Array.isArray(result) && result.length > 0 && result[0].length > 0) {
      // Assuming the first result array contains the labels
      const topLabel = result[0].find((label: any) => label.score); // Find first element with a score
      if (topLabel) {
        // 'LABEL_1' is often positive, 'LABEL_0' negative for this model.
        if (topLabel.label === 'LABEL_1') return 'positive';
        if (topLabel.label === 'LABEL_0') return 'negative';
        return topLabel.label; // return original label if not 0 or 1
      }
    }
    return null;
  }

  private async _extractIntentAndEntitiesHF(message: string, sentiment?: string | null): Promise<{ intent: Intent; entities: ExtractedEntities } | null> {
    const intentStrings = Object.values(Intent).join(', ');
    const prompt = `
Given the user's Turkish message: "${message}"
User's sentiment is: ${sentiment || 'unknown'}.

Identify the primary intent and extract relevant entities. 
Possible intents are: ${intentStrings}.
Extractable entities and their types are: 
- songName (string)
- artistName (string)
- mood (string from: neşeli, hüzünlü, enerjik, sakin, romantik)
- volumeLevel (number between 0-100, or the strings 'increase' or 'decrease')

Respond ONLY with a JSON object in the following format, without any other text or explanation:
{ "intent": "CHOSEN_INTENT_STRING", "entities": { "entityName": "value", ... } }
If no specific intent is found, use "UNKNOWN". If no entities are found, provide an empty entities object.

Example:
User message: "bana Sezen Aksu'dan hüzünlü bir şarkı çal"
Sentiment: "negative"
JSON response: { "intent": "PLAY_SONG", "entities": { "artistName": "Sezen Aksu", "mood": "hüzünlü", "songName": "bir şarkı" } }

User message: "sesi %50 yap"
Sentiment: "unknown"
JSON response: { "intent": "SET_VOLUME", "entities": { "volumeLevel": 50 } }

User message: "merhaba"
Sentiment: "unknown"
JSON response: { "intent": "GREETING", "entities": {} }

User message: "bana neşeli bir pop şarkısı önerir misin?"
Sentiment: "positive"
JSON response: { "intent": "GET_RECOMMENDATIONS_MOOD", "entities": { "mood": "neşeli", "genre": "pop" } }

User message: "bir şarkı öner"
Sentiment: "unknown"
JSON response: { "intent": "RECOMMEND_SONG", "entities": {} }

Now, for the given message and sentiment:
User message: "${message}"
Sentiment: ${sentiment || 'unknown'}
JSON response:
`;

    const hfResponse = await this._callHuggingFaceApi(DEFAULT_HF_MODEL_FOR_INTENT, prompt, 'text-generation');

    if (hfResponse && hfResponse[0] && hfResponse[0].generated_text) {
      try {
        const jsonResponseText = hfResponse[0].generated_text.trim();
        // Sometimes models add backticks or 'json' prefix, try to clean it.
        const cleanedJsonResponseText = jsonResponseText.replace(/^```json\n?|\n?```$/g, '').trim();
        const parsedJson = JSON.parse(cleanedJsonResponseText);
        console.log("HF Parsed JSON:", parsedJson);

        const hfIntentString = (typeof parsedJson.intent === 'string') ? parsedJson.intent.toUpperCase().trim() : undefined;
        let intent = Intent.UNKNOWN;
        if (hfIntentString && Intent[hfIntentString as keyof typeof Intent] !== undefined) {
          intent = Intent[hfIntentString as keyof typeof Intent];
        }

        const entities: ExtractedEntities = {};
        if (parsedJson.entities) {
          if (typeof parsedJson.entities.songName === 'string') entities.songName = parsedJson.entities.songName;
          if (typeof parsedJson.entities.artistName === 'string') entities.artistName = parsedJson.entities.artistName;
          if (typeof parsedJson.entities.mood === 'string') entities.mood = parsedJson.entities.mood;
          if (typeof parsedJson.entities.genre === 'string') entities.genre = parsedJson.entities.genre;
          
          if (parsedJson.entities.volumeLevel !== undefined) {
            const vol = parsedJson.entities.volumeLevel;
            if (typeof vol === 'number' && vol >= 0 && vol <= 100) {
              entities.volumeLevel = vol;
            } else if (typeof vol === 'string') {
              if (vol === 'increase' || vol === 'decrease') {
                entities.volumeLevel = vol;
              } else {
                const numVol = parseInt(vol, 10);
                if (!isNaN(numVol) && numVol >= 0 && numVol <= 100) {
                  entities.volumeLevel = numVol;
                }
              }
            }
          }
        }
        return { intent, entities };
      } catch (e) {
        console.error('Error parsing JSON from Hugging Face model:', e, "Raw response: ", hfResponse[0].generated_text);
        return null;
      }
    }
    return null; // Explicitly return null if hfResponse was not valid
  }

  // public async analyzeArtist(artistName: string): Promise<any> {
  //   // Logic to get artist info and analysis
  //   return {};
  // }
}

// Example usage (for testing purposes, would be integrated into UI components):
// const assistant = AssistantService.getInstance();
// assistant.processMessage('Merhaba').then(response => console.log(response.text));
// assistant.processMessage('Bana hareketli bir şarkı çal').then(response => {
//   if (response.action?.type === Intent.PLAY_SONG && response.action.payload && (response.action.payload as ExtractedEntities).songName) {
//     console.log(`AI wants to play: ${(response.action.payload as ExtractedEntities).songName}`);
//     // Here you would call the actual music playing function
//   }
// });
