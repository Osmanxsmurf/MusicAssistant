// client/src/lib/spotify-api.ts

/**
 * Spotify API ile etkileşim kurmak için kullanılan fonksiyonları ve arayüzleri içerir.
 */

// Spotify API Temel URL'si
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Spotify'dan gelen bir şarkıyı temsil eden arayüz
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string; href: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    release_date: string;
  };
  external_urls: {
    spotify: string;
  };
  uri: string; // Spotify URI
  duration_ms: number;
  popularity?: number; // 0-100 arası
  preview_url?: string | null; // 30 saniyelik önizleme URL'si
}

// Spotify'dan gelen arama sonuçlarını temsil eden arayüz
export interface SpotifySearchResponse {
  tracks: {
    href: string;
    items: SpotifyTrack[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

/**
 * Spotify API'sinde şarkı arar.
 * @param query Arama sorgusu (şarkı adı, sanatçı vb.)
 * @param accessToken Spotify Erişim Belirteci
 * @param limit Sonuç limiti (varsayılan: 10)
 * @returns SpotifyTrack dizisi veya hata durumunda boş dizi.
 */
export async function searchTracksSpotify(
  query: string,
  accessToken: string,
  limit: number = 10
): Promise<SpotifyTrack[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return [];
  }

  if (!query) {
    console.warn('Spotify arama sorgusu boş.');
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString(),
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API hatası (${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
        // Burada token yenileme mantığı eklenebilir.
      }
      return [];
    }

    const data: SpotifySearchResponse = await response.json();
    return data.tracks?.items || [];
  } catch (error) {
    console.error('Spotify şarkı arama sırasında ağ veya parse hatası:', error);
    return [];
  }
}

// Gelecekteki Spotify API fonksiyonları buraya eklenecek

/**
 * Spotify API'sinde sanatçı arar.
 * @param accessToken Spotify Erişim Belirteci
 * @param query Arama sorgusu (sanatçı adı)
 * @param limit Sonuç limiti (varsayılan: 5)
 * @returns SpotifyArtist dizisi veya hata durumunda boş dizi.
 */
export async function searchArtists(
  accessToken: string,
  query: string,
  limit: number = 5
): Promise<SpotifyArtist[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı (searchArtists).');
    return [];
  }
  if (!query) {
    console.warn('Spotify sanatçı arama sorgusu boş.');
    return [];
  }
  const params = new URLSearchParams({
    q: query,
    type: 'artist',
    limit: limit.toString(),
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API /search (artist) hatası (${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return [];
    }
    const data: SpotifyArtistSearchResponse = await response.json();
    return data.artists?.items || [];
  } catch (error) {
    console.error('Spotify sanatçı arama sırasında ağ veya parse hatası:', error);
    return [];
  }
}


/**
 * Kullanıcının Spotify'da en çok dinlediği sanatçıları getirir.
 * @param accessToken Spotify Erişim Belirteci
 * @param limit Sonuç limiti (varsayılan: 20, maksimum: 50)
 * @param time_range Veri toplama zaman aralığı ('short_term': son 4 hafta, 'medium_term': son 6 ay, 'long_term': tüm zamanlar) (varsayılan: 'medium_term')
 * @returns SpotifyArtist dizisi veya hata durumunda boş dizi.
 */
export async function getTopArtists(
  accessToken: string,
  limit: number = 20,
  time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<SpotifyArtist[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return [];
  }

  const params = new URLSearchParams({
    limit: Math.min(limit, 50).toString(), // API max 50 kabul ediyor
    time_range: time_range,
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/me/top/artists?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API /me/top/artists hatası (${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return [];
    }

    const data: SpotifyTopArtistsResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Spotify en çok dinlenen sanatçıları alma sırasında ağ veya parse hatası:', error);
    return [];
  }
}

/**
 * Kullanıcının Spotify'da en çok dinlediği şarkıları getirir.
 * @param accessToken Spotify Erişim Belirteci
 * @param limit Sonuç limiti (varsayılan: 20, maksimum: 50)
 * @param time_range Veri toplama zaman aralığı ('short_term': son 4 hafta, 'medium_term': son 6 ay, 'long_term': tüm zamanlar) (varsayılan: 'medium_term')
 * @returns SpotifyTrack dizisi veya hata durumunda boş dizi.
 */
export async function getTopTracks(
  accessToken: string,
  limit: number = 20,
  time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<SpotifyTrack[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return [];
  }

  const params = new URLSearchParams({
    limit: Math.min(limit, 50).toString(),
    time_range: time_range,
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/me/top/tracks?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API /me/top/tracks hatası (${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return [];
    }
    const data: SpotifyPagingObject<SpotifyTrack> = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Spotify en çok dinlenen şarkıları alma sırasında ağ veya parse hatası:', error);
    return [];
  }
}

/**
 * Belirli bir sanatçının en popüler şarkılarını Spotify API'sinden getirir.
 * @param artistId Spotify Sanatçı ID'si
 * @param accessToken Spotify Erişim Belirteci
 * @param market ISO 3166-1 alpha-2 ülke kodu (örn: "TR")
 * @returns Sanatçının en popüler SpotifyTrack dizisi veya hata durumunda boş dizi.
 */
export async function getArtistTopTracks(
  accessToken: string, // accessToken başa alındı
  artistId: string,
  limit: number = 10, // limit eklendi
  market: string = 'TR' // market sona alındı
): Promise<SpotifyTrack[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return [];
  }
  if (!artistId) {
    console.error('Sanatçı ID bilgisi eksik.');
    return [];
  }

  const params = new URLSearchParams({
    market: market,
    limit: limit.toString(), // limit query'ye eklendi
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/artists/${artistId}/top-tracks?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API /artists/${artistId}/top-tracks hatası (${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return [];
    }

    // API yanıtı { tracks: SpotifyTrack[] } şeklindedir.
    const data: { tracks: SpotifyTrack[] } = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Sanatçının en popüler şarkılarını alma sırasında ağ veya parse hatası:', error);
    return [];
  }
}

/**
 * Spotify'ın 'Today's Top Hits' gibi popüler bir çalma listesinden şarkıları getirir.
 * @param accessToken Spotify Erişim Belirteci
 * @param playlistId Getirilecek çalma listesinin ID'si (varsayılan: Today's Top Hits)
 * @param limit Sonuç limiti
 * @returns Çalma listesindeki SpotifyTrack dizisi veya hata durumunda boş dizi.
 */
export async function getTodaysTopHits(
  accessToken: string,
  playlistId: string = '37i9dQZF1DXcBWIGoYBM5M', // Spotify Today's Top Hits playlist ID
  limit: number = 20
): Promise<SpotifyTrack[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return [];
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    fields: 'items(track(id,name,artists(id,name),album(id,name,images),duration_ms,preview_url,external_urls,popularity,uri))' // Sadece gerekli alanları çekmek için
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/playlists/${playlistId}/tracks?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API /playlists/${playlistId}/tracks hatası (${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return [];
    }

    // API yanıtı PagingObject<PlaylistItem> şeklindedir, PlaylistItem { track: SpotifyTrack | null }
    // Sadece track'i olan ve null olmayanları alıp map'leyelim.
    const data: SpotifyPagingObject<{ track: SpotifyTrack | null }> = await response.json();
    return data.items?.map(item => item.track).filter(track => track !== null) as SpotifyTrack[] || [];
  } catch (error) {
    console.error('Popüler şarkıları alma sırasında ağ veya parse hatası:', error);
    return [];
  }
}

// Örnek: getTrackDetailsSpotify, getRecommendationsSpotify vb.

export interface RecommendationSeed {
  id: string;
  type: 'artist' | 'track' | 'genre'; // 'genre' türü için id, Spotify'ın genre seed'lerinden biri olmalı
}

export interface SpotifyArtistSearchResponse {
  artists: {
    href: string;
    items: SpotifyArtist[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

export interface RecommendationParams {
  limit?: number;
  market?: string; // Örneğin "TR" veya "US"
  seed_artists?: string[]; // Sanatçı ID'leri listesi
  seed_genres?: string[];  // Tür adları listesi (örn: "rock", "pop", "turkish-pop")
  seed_tracks?: string[];  // Şarkı ID'leri listesi

  // Audio feature parameters (min, max, target)
  min_acousticness?: number;
  max_acousticness?: number;
  target_acousticness?: number;

  min_danceability?: number;
  max_danceability?: number;
  target_danceability?: number;

  min_duration_ms?: number;
  max_duration_ms?: number;
  target_duration_ms?: number;

  min_energy?: number;
  max_energy?: number;
  target_energy?: number;

  min_instrumentalness?: number;
  max_instrumentalness?: number;
  target_instrumentalness?: number;

  min_key?: number;
  max_key?: number;
  target_key?: number;

  min_liveness?: number;
  max_liveness?: number;
  target_liveness?: number;

  min_loudness?: number;
  max_loudness?: number;
  target_loudness?: number;

  min_mode?: number;
  max_mode?: number;
  target_mode?: number;

  min_popularity?: number;
  max_popularity?: number;
  target_popularity?: number;

  min_speechiness?: number;
  max_speechiness?: number;
  target_speechiness?: number;

  min_tempo?: number;
  max_tempo?: number;
  target_tempo?: number; // BPM cinsinden

  min_time_signature?: number;
  max_time_signature?: number;
  target_time_signature?: number;

  min_valence?: number;
  max_valence?: number;
  target_valence?: number; // Müzikal pozitiflik
}


export interface SpotifyRecommendationResponse {
  tracks: SpotifyTrack[];
  seeds: {
    initialPoolSize: number;
    afterFilteringSize: number;
    afterRelinkingSize: number;
    id: string;
    type: string; // ARTIST, TRACK, GENRE
    href: string | null;
  }[];
}

// Spotify Kullanıcı Profil Arayüzü
export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  email?: string; // Kapsama bağlı olarak bulunmayabilir
  images?: { url: string; height: number | null; width: number | null }[];
  external_urls: { spotify: string };
  followers?: { href: string | null; total: number };
  country?: string;
  product?: string; // örn: "premium"
  type: string; // örn: "user"
  uri: string; // örn: "spotify:user:..."
}

// Spotify Görsel Arayüzü
export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

// Spotify Çalma Listesi Sahibi Arayüzü
export interface SpotifyOwner {
  display_name?: string;
  external_urls: { spotify: string };
  href: string;
  id: string;
  type: string;
  uri: string;
}

// Spotify Çalma Listesi Arayüzü (Listelemeler için basitleştirilmiş)
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: SpotifyOwner;
  tracks: {
    href: string;
    total: number;
  };
  external_urls: { spotify: string };
  uri: string;
  public?: boolean;
  collaborative: boolean;
  snapshot_id: string;
  type: 'playlist';
}

// Spotify Sayfalama Objesi Arayüzü
export interface SpotifyPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

// Spotify Basitleştirilmiş Sanatçı Arayüzü (Albümlerde ve bazı listelemelerde kullanılır)
export interface SpotifySimplifiedArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  href: string;
  type: 'artist'; // Added type property for consistency
  uri: string;
}

// Spotify Tam Sanatçı Arayüzü (Detaylı sanatçı bilgileri için)
export interface SpotifyArtist extends SpotifySimplifiedArtist {
  followers?: {
    href: string | null;
    total: number;
  };
  genres?: string[];
  images?: SpotifyImage[]; 
  popularity?: number; // 0-100 arası
}

// Spotify Kullanıcısının En Çok Dinlediği Sanatçılar için Yanıt Arayüzü
export interface SpotifyTopArtistsResponse extends SpotifyPagingObject<SpotifyArtist> {}

// Spotify Basitleştirilmiş Albüm Arayüzü (Yeni Çıkanlar için kullanılır)
export interface SpotifySimplifiedAlbum {
  album_group?: 'album' | 'single' | 'compilation' | 'appears_on';
  album_type: 'album' | 'single' | 'compilation';
  artists: SpotifySimplifiedArtist[];
  available_markets?: string[];
  external_urls: { spotify: string };
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  type: 'album';
  uri: string;
}

// Spotify Yeni Çıkan Albümler Yanıt Arayüzü
export interface SpotifyNewReleasesResponse {
  albums: SpotifyPagingObject<SpotifySimplifiedAlbum>;
}

// Spotify Öne Çıkan Çalma Listeleri Yanıt Arayüzü
export interface SpotifyFeaturedPlaylistsResponse {
  message?: string; 
  playlists: SpotifyPagingObject<SpotifyPlaylist>;
}

/**
 * Spotify API'sinden yeni çıkan albümleri getirir.
 * @param accessToken Spotify Erişim Belirteci
 * @param limit Sonuç limiti (varsayılan: 20, maksimum: 50)
 * @param offset Başlangıç indeksi (varsayılan: 0)
 * @param country İsteğe bağlı, ISO 3166-1 alpha-2 ülke kodu (örn: "TR")
 * @returns SpotifySimplifiedAlbum dizisi veya hata durumunda boş dizi.
 */
export async function getNewReleases(
  accessToken: string,
  limit: number = 20,
  offset: number = 0,
  country?: string
): Promise<SpotifySimplifiedAlbum[]> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return [];
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (country) {
    params.append('country', country);
  }

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/browse/new-releases?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API hatası (Yeni Çıkanlar - ${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return [];
    }

    const data: SpotifyNewReleasesResponse = await response.json();
    return data.albums?.items || [];
  } catch (error) {
    console.error('Spotify yeni çıkan albümleri alma sırasında ağ veya parse hatası:', error);
    return [];
  }
}

/**
 * Spotify API'sinden şarkı önerileri alır.
 * En az bir seed (artist, genre veya track) gereklidir. Toplamda en fazla 5 seed kullanılabilir.
 * @param params Öneri parametreleri (seed'ler, limit, market, target özellikler vb.)
 * @param accessToken Spotify Erişim Belirteci.
 * @returns Önerilen SpotifyTrack dizisi veya hata durumunda boş dizi.
 */
export async function getRecommendationsSpotify(
  params: RecommendationParams,
  accessToken: string
): Promise<SpotifyRecommendationResponse> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return { tracks: [], seeds: [] };
  }

  const {
    limit = 20,
    market,
    seed_artists,
    seed_genres,
    seed_tracks,
    ...targetParams // Geri kalan tüm target_... parametreleri
  } = params;

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
  });

  if (market) queryParams.append('market', market);

  const seedsProvided = (seed_artists?.length || 0) + (seed_genres?.length || 0) + (seed_tracks?.length || 0);
  if (seedsProvided === 0) {
    console.warn('Spotify önerileri için en az bir seed (artist, genre, track) gereklidir.');
    return { tracks: [], seeds: [] };
  }
  if (seedsProvided > 5) {
    console.warn('Spotify önerileri için en fazla 5 seed kullanılabilir.');
    // Burada isteğe bağlı olarak ilk 5'ini alabilir veya hata dönebiliriz.
    // Şimdilik devam edelim, API zaten hata verecektir.
  }

  if (seed_artists && seed_artists.length > 0) {
    queryParams.append('seed_artists', seed_artists.join(','));
  }
  if (seed_genres && seed_genres.length > 0) {
    queryParams.append('seed_genres', seed_genres.join(','));
  }
  if (seed_tracks && seed_tracks.length > 0) {
    queryParams.append('seed_tracks', seed_tracks.join(','));
  }

  // Target parametrelerini ekle
  for (const [key, value] of Object.entries(targetParams)) {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  }

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/recommendations?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API hatası (getRecommendationsSpotify - ${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return { tracks: [], seeds: [] };
    }

    const data: SpotifyRecommendationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Spotify önerileri alınırken ağ veya parse hatası:', error);
    return { tracks: [], seeds: [] };
  }
}

/**
 * Belirli bir Spotify şarkısının detaylarını ID'si ile alır.
 * @param trackId Getirilecek şarkının Spotify ID'si.
 * @param accessToken Spotify Erişim Belirteci.
 * @returns SpotifyTrack nesnesi veya hata durumunda null.
 */
export async function getTrackDetailsSpotify(
  trackId: string,
  accessToken: string
): Promise<SpotifyTrack | null> {
  if (!accessToken) {
    console.error('Spotify Access Token bulunamadı.');
    return null;
  }

  if (!trackId) {
    console.warn('Spotify parça IDsi boş.');
    return null;
  }

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API hatası (getTrackDetailsSpotify ${trackId} - ${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir.');
      }
      return null;
    }

    const trackData: SpotifyTrack = await response.json();
    return trackData;
  } catch (error) {
    console.error(`Spotify şarkı detayları (${trackId}) alınırken ağ veya parse hatası:`, error);
    return null;
  }
}

/**
 * Mevcut kimliği doğrulanmış kullanıcının profilini getirir.
 * Tam ayrıntılar için 'user-read-private' ve 'user-read-email' kapsamları gerekir.
 * @param accessToken Spotify API erişim belirteci.
 * @returns Kullanıcının profil verilerine veya bir hata oluşursa null değerine çözümlenen bir Promise.
 */
export async function getUserProfile(accessToken: string): Promise<SpotifyUserProfile | null> {
  if (!accessToken) {
    console.error('Spotify API çağrısı (getUserProfile): Erişim belirteci sağlanmadı.');
    return null;
  }

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API Hatası (getUserProfile - ${response.status}):`, errorData.error?.message || response.statusText);
      if (response.status === 401) {
        console.error('Spotify Access Token geçersiz veya süresi dolmuş olabilir. Token yenileme mantığı düşünülmeli.');
      }
      return null;
    }

    const data: SpotifyUserProfile = await response.json();
    return data;
  } catch (error) {
    console.error('Spotify kullanıcı profili alınırken ağ veya parse hatası:', error);
    return null;
  }
}

/**
 * Mevcut kimliği doğrulanmış kullanıcının çalma listelerini getirir.
 * 'playlist-read-private' ve 'playlist-read-collaborative' kapsamları gerekebilir.
 * @param accessToken Spotify API erişim belirteci.
 * @param limit Sonuç limiti (varsayılan: 20).
 * @param offset Sonuçların başlangıç noktası (varsayılan: 0).
 * @returns Kullanıcının çalma listelerini içeren bir sayfalama nesnesi veya hata durumunda null.
 */
export async function getUserPlaylists(
  accessToken: string,
  limit: number = 20,
  offset: number = 0
): Promise<SpotifyPagingObject<SpotifyPlaylist> | null> {
  if (!accessToken) {
    console.error('Spotify API çağrısı (getUserPlaylists): Erişim belirteci sağlanmadı.');
    return null;
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/me/playlists?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API Hatası (getUserPlaylists - ${response.status}):`, errorData.error?.message || response.statusText);
      return null;
    }

    const data: SpotifyPagingObject<SpotifyPlaylist> = await response.json();
    return data;
  } catch (error) {
    console.error('Spotify kullanıcı çalma listeleri alınırken ağ veya parse hatası:', error);
    return null;
  }
}

/**
 * Spotify'da öne çıkan çalma listelerini getirir.
 * @param accessToken Spotify API erişim belirteci.
 * @param limit Sonuç limiti (varsayılan: 20).
 * @param offset Sonuçların başlangıç noktası (varsayılan: 0).
 * @param country İsteğe bağlı. Sonuçları belirli bir ülke için filtreler (ISO 3166-1 alpha-2 ülke kodu).
 * @returns Öne çıkan çalma listelerini ve bir mesaj içeren bir nesne veya hata durumunda null.
 */
export async function getFeaturedPlaylists(
  accessToken: string,
  limit: number = 20,
  offset: number = 0,
  country?: string
): Promise<SpotifyFeaturedPlaylistsResponse | null> {
  if (!accessToken) {
    console.error('Spotify API çağrısı (getFeaturedPlaylists): Erişim belirteci sağlanmadı.');
    return null;
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (country) {
    params.append('country', country);
  }

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/browse/featured-playlists?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen Spotify API hatası' }));
      console.error(`Spotify API Hatası (getFeaturedPlaylists - ${response.status}):`, errorData.error?.message || response.statusText);
      return null;
    }

    const data: SpotifyFeaturedPlaylistsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Spotify öne çıkan çalma listeleri alınırken ağ veya parse hatası:', error);
    return null;
  }
}

