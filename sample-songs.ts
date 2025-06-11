/**
 * Örnek Şarkı Verileri
 * 
 * Bu modül, uygulama ilk çalıştırıldığında veya veritabanında veri
 * bulunmadığında kullanılacak örnek şarkı verilerini içerir.
 */

import { Song } from '../ai/super-ai/types/music-types';

// Tüm örnek şarkılar YouTube videoId'lerini içerir
export const sampleSongs: Song[] = [
  {
    id: 'song_001',
    title: 'Yıldız Tilbe - Delikanlım',
    artist: 'Yıldız Tilbe',
    album: 'Aşk İnsanı Değiştirir',
    genre: ['Pop', 'Turkish Pop'],
    mood: ['romantic', 'nostalgic'],
    videoId: 'TbY9ULcGSWY',
    youtubeId: 'TbY9ULcGSWY',
    imageUrl: 'https://i.ytimg.com/vi/TbY9ULcGSWY/hqdefault.jpg',
    duration: 254,
    releaseDate: '2002',
    popularity: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1500000
  },
  {
    id: 'song_002',
    title: 'Tarkan - Kuzu Kuzu',
    artist: 'Tarkan',
    album: 'Karma',
    genre: ['Pop', 'Turkish Pop', 'Dance'],
    mood: ['energetic', 'happy'],
    videoId: 'N3OsAP5N0AA',
    youtubeId: 'N3OsAP5N0AA',
    imageUrl: 'https://i.ytimg.com/vi/N3OsAP5N0AA/hqdefault.jpg',
    duration: 236,
    releaseDate: '2001',
    popularity: 95,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 2500000
  },
  {
    id: 'song_003',
    title: 'Sezen Aksu - Kaçın Kurası',
    artist: 'Sezen Aksu',
    album: 'Işık Doğudan Yükselir',
    genre: ['Pop', 'Turkish Pop', 'Folk'],
    mood: ['sad', 'melancholic'],
    videoId: 'MFEcPHtJx_o',
    youtubeId: 'MFEcPHtJx_o',
    imageUrl: 'https://i.ytimg.com/vi/MFEcPHtJx_o/hqdefault.jpg',
    duration: 280,
    releaseDate: '1995',
    popularity: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1200000
  },
  {
    id: 'song_004',
    title: 'Müslüm Gürses - Nilüfer',
    artist: 'Müslüm Gürses',
    album: 'Sandık',
    genre: ['Arabesk', 'Turkish Classical'],
    mood: ['sad', 'nostalgic', 'melancholic'],
    videoId: 'ptqdjoPAFM8',
    youtubeId: 'ptqdjoPAFM8',
    imageUrl: 'https://i.ytimg.com/vi/ptqdjoPAFM8/hqdefault.jpg',
    duration: 327,
    releaseDate: '1988',
    popularity: 92,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 3000000
  },
  {
    id: 'song_005',
    title: 'Barış Manço - Dağlar Dağlar',
    artist: 'Barış Manço',
    album: 'Dağlar Dağlar',
    genre: ['Rock', 'Anatolian Rock', 'Turkish Folk'],
    mood: ['nostalgic', 'energetic'],
    videoId: 'Db18z1Zbgvg',
    youtubeId: 'Db18z1Zbgvg',
    imageUrl: 'https://i.ytimg.com/vi/Db18z1Zbgvg/hqdefault.jpg',
    duration: 385,
    releaseDate: '1970',
    popularity: 93,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 2800000
  },
  {
    id: 'song_006',
    title: 'MFÖ - Ele Güne Karşı Yapayalnız',
    artist: 'MFÖ',
    album: 'Ele Güne Karşı Yapayalnız',
    genre: ['Pop', 'Turkish Pop', 'Rock'],
    mood: ['happy', 'energetic'],
    videoId: 'Lx16B3-4OYI',
    youtubeId: 'Lx16B3-4OYI',
    imageUrl: 'https://i.ytimg.com/vi/Lx16B3-4OYI/hqdefault.jpg',
    duration: 257,
    releaseDate: '1986',
    popularity: 88,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1900000
  },
  {
    id: 'song_007',
    title: 'Sibel Can - Padişah',
    artist: 'Sibel Can',
    album: 'Padişah',
    genre: ['Turkish Pop', 'Arabesk'],
    mood: ['romantic', 'energetic'],
    videoId: 'UXMIkCi3pQ4',
    youtubeId: 'UXMIkCi3pQ4',
    imageUrl: 'https://i.ytimg.com/vi/UXMIkCi3pQ4/hqdefault.jpg',
    duration: 231,
    releaseDate: '1997',
    popularity: 86,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1400000
  },
  {
    id: 'song_008',
    title: 'Volkan Konak - Yarim Yarim',
    artist: 'Volkan Konak',
    album: 'Mora',
    genre: ['Turkish Folk', 'Black Sea'],
    mood: ['sad', 'melancholic'],
    videoId: 'TkCyO8YGNfU',
    youtubeId: 'TkCyO8YGNfU',
    imageUrl: 'https://i.ytimg.com/vi/TkCyO8YGNfU/hqdefault.jpg',
    duration: 299,
    releaseDate: '2004',
    popularity: 87,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1700000
  },
  {
    id: 'song_009',
    title: 'Ferdi Tayfur - Bana Sor',
    artist: 'Ferdi Tayfur',
    album: 'Bana Sor',
    genre: ['Arabesk', 'Turkish Classical'],
    mood: ['sad', 'melancholic'],
    videoId: 'OYfXBkCU0Ws',
    youtubeId: 'OYfXBkCU0Ws',
    imageUrl: 'https://i.ytimg.com/vi/OYfXBkCU0Ws/hqdefault.jpg',
    duration: 345,
    releaseDate: '1983',
    popularity: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 2100000
  },
  {
    id: 'song_010',
    title: 'Zeynep Bastık - Felaket',
    artist: 'Zeynep Bastık',
    album: 'Akustikler',
    genre: ['Pop', 'Turkish Pop', 'Acoustic'],
    mood: ['romantic', 'calm'],
    videoId: 'DKPX3MSuBhQ',
    youtubeId: 'DKPX3MSuBhQ',
    imageUrl: 'https://i.ytimg.com/vi/DKPX3MSuBhQ/hqdefault.jpg',
    duration: 268,
    releaseDate: '2019',
    popularity: 91,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 2300000
  },
  {
    id: 'song_011',
    title: 'Pinhani - Dön Bak Dünyaya',
    artist: 'Pinhani',
    album: 'Zaman Beklemez',
    genre: ['Rock', 'Turkish Rock'],
    mood: ['calm', 'focused'],
    videoId: 'XKiXxOGQ3uE',
    youtubeId: 'XKiXxOGQ3uE',
    imageUrl: 'https://i.ytimg.com/vi/XKiXxOGQ3uE/hqdefault.jpg',
    duration: 271,
    releaseDate: '2008',
    popularity: 84,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1300000
  },
  {
    id: 'song_012',
    title: 'Athena - Arsız Gönül',
    artist: 'Athena',
    album: 'Altüst',
    genre: ['Rock', 'Punk', 'Turkish Rock'],
    mood: ['energetic', 'happy'],
    videoId: 'GH-k_TW9C_E',
    youtubeId: 'GH-k_TW9C_E',
    imageUrl: 'https://i.ytimg.com/vi/GH-k_TW9C_E/hqdefault.jpg',
    duration: 248,
    releaseDate: '2004',
    popularity: 88,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1600000
  },
  {
    id: 'song_013',
    title: 'Sıla - Vaziyetler',
    artist: 'Sıla',
    album: 'Yeni Ay',
    genre: ['Pop', 'Turkish Pop'],
    mood: ['romantic', 'calm'],
    videoId: '2-rPWZOqHEg',
    youtubeId: '2-rPWZOqHEg',
    imageUrl: 'https://i.ytimg.com/vi/2-rPWZOqHEg/hqdefault.jpg',
    duration: 291,
    releaseDate: '2012',
    popularity: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 2000000
  },
  {
    id: 'song_014',
    title: 'Ceza - Suspus',
    artist: 'Ceza',
    album: 'Rapstar',
    genre: ['Hip Hop', 'Turkish Rap'],
    mood: ['energetic', 'angry'],
    videoId: 'XJdGfbDY2lo',
    youtubeId: 'XJdGfbDY2lo',
    imageUrl: 'https://i.ytimg.com/vi/XJdGfbDY2lo/hqdefault.jpg',
    duration: 322,
    releaseDate: '2004',
    popularity: 92,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 2200000
  },
  {
    id: 'song_015',
    title: 'Manga - Bir Kadın Çizeceksin',
    artist: 'Manga',
    album: 'Şehr-i Hüzün',
    genre: ['Rock', 'Alternative', 'Turkish Rock'],
    mood: ['energetic', 'focused'],
    videoId: 'HUKDxGtfYgY',
    youtubeId: 'HUKDxGtfYgY',
    imageUrl: 'https://i.ytimg.com/vi/HUKDxGtfYgY/hqdefault.jpg',
    duration: 315,
    releaseDate: '2009',
    popularity: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 1800000
  }
];

/**
 * Belirli bir ruh haline göre şarkıları filtreler
 * @param mood Ruh hali
 * @param limit Maksimum şarkı sayısı
 * @returns Filtrelenmiş şarkı listesi
 */
export function getSongsByMood(mood: string, limit: number = 10): Song[] {
  const filteredSongs = sampleSongs.filter(song => 
    song.mood && song.mood.includes(mood)
  );
  
  // Sonuçları karıştır ve limit kadar döndür
  return shuffleArray(filteredSongs).slice(0, limit);
}

/**
 * Verilen şarkı listesini rastgele karıştırır
 * @param array Karıştırılacak dizi
 * @returns Karıştırılmış dizi
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * İsme göre şarkı arama yapar
 * @param query Arama sorgusu
 * @param limit Maksimum şarkı sayısı
 * @returns Arama sonuçları
 */
export function searchSampleSongs(query: string, limit: number = 10): Song[] {
  const lowerQuery = query.toLowerCase();
  
  const results = sampleSongs.filter(song => 
    song.title.toLowerCase().includes(lowerQuery) || 
    song.artist.toLowerCase().includes(lowerQuery) ||
    (song.album && song.album.toLowerCase().includes(lowerQuery)) ||
    (song.genre && song.genre.some(g => g.toLowerCase().includes(lowerQuery)))
  );
  
  return results.slice(0, limit);
}

/**
 * Şarkı ID'sine göre şarkı bulur
 * @param songId Şarkı ID'si
 * @returns Bulunan şarkı veya undefined
 */
export function getSongById(songId: string): Song | undefined {
  return sampleSongs.find(song => song.id === songId);
}

/**
 * Türe göre şarkı filtreler
 * @param genre Tür
 * @param limit Maksimum şarkı sayısı
 * @returns Filtrelenmiş şarkı listesi
 */
export function getSongsByGenre(genre: string, limit: number = 10): Song[] {
  const lowerGenre = genre.toLowerCase();
  
  const filteredSongs = sampleSongs.filter(song => 
    song.genre && song.genre.some(g => g.toLowerCase().includes(lowerGenre))
  );
  
  return shuffleArray(filteredSongs).slice(0, limit);
}

/**
 * Sanatçıya göre şarkı filtreler
 * @param artist Sanatçı adı
 * @param limit Maksimum şarkı sayısı
 * @returns Filtrelenmiş şarkı listesi
 */
export function getSongsByArtist(artist: string, limit: number = 10): Song[] {
  const lowerArtist = artist.toLowerCase();
  
  const filteredSongs = sampleSongs.filter(song => 
    song.artist.toLowerCase().includes(lowerArtist)
  );
  
  return filteredSongs.slice(0, limit);
}

/**
 * Tüm örnek şarkıları döndürür
 * @returns Tüm örnek şarkılar
 */
export function getAllSampleSongs(): Song[] {
  return [...sampleSongs];
}
