/**
 * Last.fm API entegrasyonu
 * Bu modül, Last.fm API ile iletişim kurmak için gerekli fonksiyonları içerir.
 */
// Last.fm API anahtarı
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY || 'ed0f28ee6e2da02b1796c1bce3d85535';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Şarkı bilgilerini alır
 * @param artist Sanatçı adı
 * @param track Şarkı adı
 * @returns Şarkı bilgileri
 */
export async function getTrackInfo(artist: string, track: string): Promise<LastfmTrack | null> {
  try {
    const params = new URLSearchParams({
      method: 'track.getInfo',
      artist,
      track,
      api_key: LASTFM_API_KEY,
      format: 'json',
    });
    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Last.fm API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.track) {
      console.error('Last.fm şarkı bilgileri hatası:', data.message || 'Bilinmeyen hata');
      return null;
    }
    return {
      name: data.track.name,
      artist: data.track.artist.name,
      album: data.track.album?.title || '',
      duration: parseInt(data.track.duration) || 0,
      listeners: parseInt(data.track.listeners) || 0,
      playcount: parseInt(data.track.playcount) || 0,
      url: data.track.url,
      imageUrl: data.track.album && data.track.album.image ? data.track.album.image.find((img: any) => img.size === 'large')?.['#text'] || '' : '',
      tags: data.track.toptags?.tag?.map((tag: any) => tag.name) || [],
      summary: data.track.wiki?.summary || '',
    };
  } catch (error) {
    console.error('Last.fm şarkı bilgileri alınırken hata:', error);
    return null;
  }
}

/**
 * Sanatçı bilgilerini alır
 * @param artist Sanatçı adı
 * @returns Sanatçı bilgileri
 */
export async function getArtistInfo(artist: string): Promise<LastfmArtist | null> {
  try {
    const params = new URLSearchParams({
      method: 'artist.getInfo',
      artist,
      api_key: LASTFM_API_KEY,
      format: 'json',
    });
    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Last.fm API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.artist) {
      console.error('Last.fm sanatçı bilgileri hatası:', data.message || 'Bilinmeyen hata');
      return null;
    }
    return {
      name: data.artist.name,
      listeners: parseInt(data.artist.stats.listeners) || 0,
      playcount: parseInt(data.artist.stats.playcount) || 0,
      url: data.artist.url,
      imageUrl: data.artist.image ? data.artist.image.find((img: any) => img.size === 'large')?.['#text'] || '' : '',
      similar: data.artist.similar?.artist?.map((a: any) => ({
        name: a.name,
        url: a.url,
        imageUrl: a.image ? a.image.find((img: any) => img.size === 'large')?.['#text'] || '' : '',
      })) || [],
      tags: data.artist.tags?.tag?.map((tag: any) => tag.name) || [],
      biography: data.artist.bio?.content || '',
      summary: data.artist.bio?.summary || '',
    };
  } catch (error) {
    console.error('Last.fm sanatçı bilgileri alınırken hata:', error);
    return null;
  }
}

/**
 * Bir şarkıya benzer şarkıları alır
 * @param artist Sanatçı adı
 * @param track Şarkı adı
 * @param limit Sonuç sayısı
 * @returns Benzer şarkılar
 */
export async function getSimilarTracks(artist: string, track: string, limit: number = 10): Promise<LastfmTrack[]> {
  try {
    const params = new URLSearchParams({
      method: 'track.getSimilar',
      artist,
      track,
      limit: limit.toString(),
      api_key: LASTFM_API_KEY,
      format: 'json',
    });
    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Last.fm API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error || !data.similartracks?.track) {
      console.error('Last.fm benzer şarkılar hatası:', data.message || 'Bilinmeyen hata');
      return [];
    }
    const tracks = Array.isArray(data.similartracks.track) 
      ? data.similartracks.track 
      : [data.similartracks.track];
    
    return tracks.map((t: any) => ({
      name: t.name,
      artist: t.artist.name,
      duration: 0, // API bu bilgiyi dönmüyor
      listeners: parseInt(t.listeners) || 0,
      playcount: parseInt(t.playcount) || 0,
      url: t.url,
      imageUrl: t.image?.find((img: any) => img.size === 'large')?.['#text'] || '',
      tags: [],
      summary: '',
    }));
  } catch (error) {
    console.error('Last.fm benzer şarkılar alınırken hata:', error);
    return [];
  }
}

/**
 * Trend olan şarkıları alır
 * @param limit Sonuç sayısı
 * @returns Trend şarkılar
 */
export async function getTopTracks(limit: number = 10): Promise<LastfmTrack[]> {
  try {
    const params = new URLSearchParams({
      method: 'chart.getTopTracks',
      limit: limit.toString(),
      api_key: LASTFM_API_KEY,
      format: 'json',
    });
    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Last.fm API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error || !data.tracks?.track) {
      console.error('Last.fm trend şarkılar hatası:', data.message || 'Bilinmeyen hata');
      return [];
    }
    const tracks = Array.isArray(data.tracks.track) 
      ? data.tracks.track 
      : [data.tracks.track];
    
    return tracks.map((t: any) => ({
      name: t.name,
      artist: t.artist.name,
      duration: 0, // API bu bilgiyi dönmüyor
      listeners: parseInt(t.listeners) || 0,
      playcount: parseInt(t.playcount) || 0,
      url: t.url,
      imageUrl: t.image?.find((img: any) => img.size === 'large')?.['#text'] || '',
      tags: [],
      summary: '',
    }));
  } catch (error) {
    console.error('Last.fm trend şarkılar alınırken hata:', error);
    return [];
  }
}

/**
 * Bir türe göre en iyi şarkıları alır
 * @param tag Tür adı
 * @param limit Sonuç sayısı
 * @returns Tür şarkıları
 */
export async function getTopTracksByTag(tag: string, limit: number = 10): Promise<LastfmTrack[]> {
  try {
    const params = new URLSearchParams({
      method: 'tag.getTopTracks',
      tag,
      limit: limit.toString(),
      api_key: LASTFM_API_KEY,
      format: 'json',
    });
    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Last.fm API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error || !data.tracks?.track) {
      console.error('Last.fm tür şarkıları hatası:', data.message || 'Bilinmeyen hata');
      return [];
    }
    const tracks = Array.isArray(data.tracks.track) 
      ? data.tracks.track 
      : [data.tracks.track];
    
    return tracks.map((t: any) => ({
      name: t.name,
      artist: t.artist.name,
      duration: 0, // API bu bilgiyi dönmüyor
      listeners: parseInt(t.listeners) || 0,
      playcount: parseInt(t.playcount) || 0,
      url: t.url,
      imageUrl: t.image?.find((img: any) => img.size === 'large')?.['#text'] || '',
      tags: [tag],
      summary: '',
    }));
  } catch (error) {
    console.error('Last.fm tür şarkıları alınırken hata:', error);
    return [];
  }
}


/**
 * Şarkıları ada göre arar (isteğe bağlı olarak sanatçı adıyla birlikte)
 * @param trackName Aranan şarkının adı
 * @param artistName İsteğe bağlı, sanatçının adı
 * @param limit Sonuç sayısı
 * @returns Bulunan şarkıların listesi
 */
export async function searchTrack(
  trackName: string,
  artistName?: string,
  limit: number = 10
): Promise<LastfmTrack[]> {
  try {
    const params = new URLSearchParams({
      method: 'track.search',
      track: trackName,
      limit: limit.toString(),
      api_key: LASTFM_API_KEY,
      format: 'json',
    });

    if (artistName) {
      params.append('artist', artistName);
    }

    const response = await fetch(`${LASTFM_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Last.fm API hatası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error || !data.results?.trackmatches?.track) {
      console.error('Last.fm şarkı arama hatası:', data.message || 'Bilinmeyen hata veya sonuç bulunamadı');
      return [];
    }

    const tracks = Array.isArray(data.results.trackmatches.track)
      ? data.results.trackmatches.track
      : [data.results.trackmatches.track];

    return tracks.map((t: any) => ({
      name: t.name,
      artist: t.artist, // track.search artist'ı doğrudan bir string olarak döner
      duration: 0, // track.search genellikle duration döndürmez
      listeners: parseInt(t.listeners) || 0,
      playcount: 0, // track.search genellikle playcount döndürmez
      url: t.url,
      imageUrl: t.image?.find((img: any) => img.size === 'large')?.['#text'] || '',
      album: '', // track.search genellikle album adı döndürmez
      tags: [], // track.search tags döndürmez
      summary: '', // track.search summary döndürmez
    }));
  } catch (error) {
    console.error('Last.fm şarkı arama sırasında hata:', error);
    return [];
  }
}

/**
 * Türler
 */
export interface LastfmTrack {
  name: string;
  artist: string;
  album?: string;
  duration: number;
  listeners: number;
  playcount: number;
  url: string;
  imageUrl: string;
  tags: string[];
  summary: string;
}

export interface LastfmArtist {
  name: string;
  listeners: number;
  playcount: number;
  url: string;
  imageUrl: string;
  similar: {
    name: string;
    url: string;
    imageUrl: string;
  }[];
  tags: string[];
  biography: string;
  summary: string;
}
