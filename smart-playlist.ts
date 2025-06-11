/**
 * Akıllı Çalma Listeleri Servisi
 * 
 * Bu modül, kullanıcının dinleme alışkanlıklarına ve tercihlerine
 * dayalı olarak akıllı çalma listeleri oluşturur.
 */

import { Song } from '@shared/schema';
import { MoodType } from '../ai/context/mood-detector';
import { UserProfile } from '../ai/user/user-profile';

export interface SmartPlaylist {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  songs: Song[];
  criteria: PlaylistCriteria;
  coverImage?: string;
}

export interface PlaylistCriteria {
  moods?: MoodType[];
  genres?: string[];
  artists?: string[];
  era?: { start: number; end: number };
  tempo?: { min: number; max: number };
  includeUserFavorites?: boolean;
  excludeRecentlyPlayed?: boolean;
}

/**
 * Kullanıcının tercihlerine göre akıllı çalma listesi oluşturur
 */
export async function createSmartPlaylist(
  userId: string,
  name: string,
  criteria: PlaylistCriteria,
  songLimit: number = 15
): Promise<SmartPlaylist> {
  const userProfile = await UserProfile.load(userId);
  
  // Benzersiz ID oluştur
  const playlistId = `playlist_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Kriterlere göre şarkıları al
  const songs = await getSongsByCriteria(criteria, userProfile, songLimit);
  
  // Çalma listesi nesnesini oluştur
  const playlist: SmartPlaylist = {
    id: playlistId,
    name,
    description: generatePlaylistDescription(criteria),
    createdAt: new Date(),
    updatedAt: new Date(),
    songs,
    criteria,
    coverImage: songs.length > 0 ? `https://img.youtube.com/vi/${songs[0].youtubeId}/hqdefault.jpg` : undefined
  };
  
  // Playlist saving to Xata has been removed.
  // The playlist object is created in memory but not persisted.
  console.warn(`SmartPlaylist.createSmartPlaylist: Playlist persistence to Xata has been removed. Playlist '${name}' created in memory only.`);
  
  return playlist;
}

/**
 * Belirtilen kriterlere göre şarkıları getirir
 */
async function getSongsByCriteria(
  // Using underscore prefix to indicate intentionally unused parameters
  _criteria: PlaylistCriteria,
  _userProfile: UserProfile,
  _limit: number
): Promise<Song[]> {
  console.warn('getSongsByCriteria is not fully implemented and returns an empty array.');
  // TODO: Re-implement song fetching and filtering logic without Xata.
  // This function should fetch songs based on criteria (moods, genres, artists, era, tempo)
  // from sources like Last.fm, YouTube, or a local cache, then filter them.
  // It should also consider userProfile for personalization if criteria.includeUserFavorites is true.
  return [];
}

/**
 * Çalma listesi kriterleri için açıklama oluşturur
 */
function generatePlaylistDescription(criteria: PlaylistCriteria): string {
  const parts = [];
  
  if (criteria.moods && criteria.moods.length > 0) {
    parts.push(`${criteria.moods.join(', ')} ruh hallerine uygun`);
  }
  
  if (criteria.genres && criteria.genres.length > 0) {
    parts.push(`${criteria.genres.join(', ')} türlerinde`);
  }
  
  if (criteria.artists && criteria.artists.length > 0) {
    parts.push(`${criteria.artists.join(', ')} sanatçılarından`);
  }
  
  if (criteria.era) {
    parts.push(`${criteria.era.start}-${criteria.era.end} yılları arasından`);
  }
  
  if (criteria.tempo) {
    const tempoDescription = criteria.tempo.min < 100 ? 'sakin' : 
                          criteria.tempo.max > 120 ? 'enerjik' : 'orta tempolu';
    parts.push(tempoDescription);
  }
  
  let description = parts.join(', ') + ' şarkılar';
  
  if (criteria.includeUserFavorites) {
    description += ', favorilerinizden seçimlerle';
  }
  
  return description;
}

/**
 * Günün saatine ve haftanın gününe göre özel çalma listeleri oluşturur
 */
export async function createTimeBasedPlaylist(
  userId: string,
  limit: number = 15
): Promise<SmartPlaylist> {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0: Pazar, 1: Pazartesi, ...
  
  let name = '';
  let moods: MoodType[] = [];
  let description = '';
  
  // Sabah (06:00 - 12:00)
  if (hour >= 6 && hour < 12) {
    name = 'Güne Başlangıç';
    moods = [MoodType.ENERGETIC, MoodType.HAPPY];
    description = 'Güne enerjik başlamanızı sağlayacak şarkılar';
  } 
  // Öğlen (12:00 - 17:00)
  else if (hour >= 12 && hour < 17) {
    name = 'Öğlen Motivasyonu';
    moods = [MoodType.HAPPY, MoodType.ENERGETIC];
    description = 'Gün ortasında motivasyonunuzu yüksek tutacak şarkılar';
  } 
  // Akşam (17:00 - 22:00)
  else if (hour >= 17 && hour < 22) {
    name = 'Akşam Rahatlaması';
    moods = [MoodType.CALM, MoodType.ROMANTIC];
    description = 'Günün stresini atmanıza yardımcı olacak şarkılar';
  } 
  // Gece (22:00 - 06:00)
  else {
    name = 'Gece Sakinliği';
    moods = [MoodType.CALM, MoodType.MELANCHOLIC];
    description = 'Gece saatlerine eşlik edecek sakin şarkılar';
  }
  
  // Hafta sonu özel
  if (day === 0 || day === 6) {
    name = `Hafta Sonu ${name}`;
    description = `Hafta sonu için ${description.toLowerCase()}`;
  }
  
  return createSmartPlaylist(userId, name, { moods, includeUserFavorites: true }, limit);
}

/**
 * Kullanıcının ruh haline göre özel çalma listesi oluşturur
 */
export async function createMoodPlaylist(
  userId: string,
  mood: MoodType,
  limit: number = 15
): Promise<SmartPlaylist> {
  const moodNames: Record<MoodType, string> = {
    [MoodType.HAPPY]: 'Mutlu Anlar',
    [MoodType.SAD]: 'Hüzünlü Melodiler',
    [MoodType.ENERGETIC]: 'Enerji Patlaması',
    [MoodType.CALM]: 'Sakinlik Zamanı',
    [MoodType.ROMANTIC]: 'Romantik Notalar',
    [MoodType.ANGRY]: 'Güçlü Duygular',
    [MoodType.NOSTALGIC]: 'Nostalji Yolculuğu',
    [MoodType.MELANCHOLIC]: 'Melankolik Anlar'
  };
  
  const name = moodNames[mood] || `${mood} Moduna Özel`;
  
  return createSmartPlaylist(userId, name, { 
    moods: [mood], 
    includeUserFavorites: true,
    excludeRecentlyPlayed: true
  }, limit);
}
