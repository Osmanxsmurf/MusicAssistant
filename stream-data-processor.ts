/**
 * Akışlı Veri İşleme Modülü
 * 
 * Bu modül, büyük veri setlerini bellek dostu bir şekilde işlemek için
 * akışlı (stream) işleme tekniklerini kullanır. Özellikle büyük CSV, JSON 
 * ve metin dosyalarında performans iyileştirmesi sağlar.
 */

import { createReadStream } from 'fs';
import { parse as csvParse } from 'csv-parse';
import * as fs from 'fs';
import * as readline from 'readline';
import { Song } from '@shared/schema';

/**
 * Büyük CSV dosyalarını akışlı olarak işler
 * @param filePath Dosya yolu
 * @param onRow Her satır için geri çağırma fonksiyonu
 * @param onComplete İşlem tamamlandığında çağrılacak fonksiyon
 * @param onError Hata durumunda çağrılacak fonksiyon
 */
export function processCSVStream(
  filePath: string,
  onRow: (row: any) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): void {
  // CSV akışı oluştur
  const stream = createReadStream(filePath)
    .pipe(csvParse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  // Veriyi işle
  stream.on('data', (row) => {
    try {
      onRow(row);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error('CSV satırı işlenirken hata:', error);
      }
    }
  });

  // Tamamlanma
  stream.on('end', () => {
    if (onComplete) {
      onComplete();
    }
  });

  // Hata yakalama
  stream.on('error', (error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('CSV akışı işlenirken hata:', error);
    }
  });
}

/**
 * CSV dosyasını şarkı nesnelerine dönüştürür
 * @param filePath CSV dosya yolu
 * @returns Şarkı nesneleri
 */
export async function csvToSongs(filePath: string): Promise<Song[]> {
  return new Promise((resolve, reject) => {
    const songs: Song[] = [];
    
    processCSVStream(
      filePath,
      (row) => {
        // CSV satırını Song nesnesine dönüştür
        const song: Song = {
          id: row.id || `song-${Math.random().toString(36).substring(2, 11)}`,
          title: row.title || '',
          artist: row.artist || '',
          album: row.album || '',
          duration: parseInt(row.duration) || 0,
          genre: row.genre ? row.genre.split(',').map((g: string) => g.trim()) : [],
          mood: row.mood ? row.mood.split(',').map((m: string) => m.trim()) : [],
          imageUrl: row.imageUrl || row.coverUrl || '',
          releaseDate: row.releaseDate || row.year || '',
          popularity: parseInt(row.popularity) || 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          youtubeId: row.youtubeId || ''
        };
        
        songs.push(song);
      },
      () => resolve(songs),
      (error) => reject(error)
    );
  });
}

/**
 * Büyük metin dosyalarını satır satır işler
 * @param filePath Dosya yolu
 * @param onLine Her satır için geri çağırma fonksiyonu
 * @param onComplete İşlem tamamlandığında çağrılacak fonksiyon
 * @param onError Hata durumunda çağrılacak fonksiyon
 */
export async function processTextStream(
  filePath: string,
  onLine: (line: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const fileStream = fs.createReadStream(filePath);
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      try {
        onLine(line);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Metin satırı işlenirken hata:', error);
        }
      }
    }
    
    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      console.error('Metin akışı işlenirken hata:', error);
    }
  }
}

/**
 * Büyük JSON dosyalarını akışlı olarak işler
 * @param filePath Dosya yolu
 * @param onObject Her JSON nesnesi için geri çağırma fonksiyonu
 * @param onComplete İşlem tamamlandığında çağrılacak fonksiyon
 * @param onError Hata durumunda çağrılacak fonksiyon
 */
export async function processJSONStream(
  filePath: string,
  onObject: (obj: any) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // JSON dosyası bir dizi mi yoksa tek bir nesne mi kontrol et
    const jsonData = JSON.parse(fileContent);
    
    if (Array.isArray(jsonData)) {
      // Dizi ise her öğeyi tek tek işle
      for (const obj of jsonData) {
        try {
          onObject(obj);
        } catch (error) {
          if (onError) {
            onError(error as Error);
          } else {
            console.error('JSON nesnesi işlenirken hata:', error);
          }
        }
      }
    } else {
      // Tek bir nesne ise direkt işle
      try {
        onObject(jsonData);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('JSON nesnesi işlenirken hata:', error);
        }
      }
    }
    
    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      console.error('JSON akışı işlenirken hata:', error);
    }
  }
}

/**
 * Şarkı veritabanını akışlı olarak işler ve dönüştürür
 * @param jsonFilePath JSON dosya yolu
 * @returns İşlenmiş şarkı nesneleri
 */
export async function processSongDatabase(jsonFilePath: string): Promise<Song[]> {
  return new Promise((resolve, reject) => {
    const songs: Song[] = [];
    
    processJSONStream(
      jsonFilePath,
      (obj) => {
        // Her bir şarkıyı işle
        if (Array.isArray(obj)) {
          // Eğer kök nesne bir dizi ise
          obj.forEach(songData => {
            const song = transformSongData(songData);
            if (song) songs.push(song);
          });
        } else {
          // Tek bir şarkı nesnesi ise
          const song = transformSongData(obj);
          if (song) songs.push(song);
        }
      },
      () => resolve(songs),
      (error) => reject(error)
    );
  });
}

/**
 * Ham şarkı verisini Song nesnesine dönüştürür
 * @param songData Ham şarkı verisi
 * @returns Dönüştürülmüş Song nesnesi veya null
 */
function transformSongData(songData: any): Song | null {
  if (!songData || !songData.title) return null;
  
  // Tür ve ruh hali alanlarını diziye dönüştür
  let genre = songData.genre || [];
  if (typeof genre === 'string') {
    genre = genre.split(',').map((g: string) => g.trim());
  }
  
  let mood = songData.mood || [];
  if (typeof mood === 'string') {
    mood = mood.split(',').map((m: string) => m.trim());
  }
  
  return {
    id: songData.id || `song-${Math.random().toString(36).substring(2, 11)}`,
    title: songData.title,
    artist: songData.artist || 'Bilinmeyen Sanatçı',
    album: songData.album || '',
    duration: parseInt(songData.duration) || 0,
    genre: genre,
    mood: mood,
    imageUrl: songData.imageUrl || songData.coverUrl || '',
    releaseDate: songData.releaseDate || songData.year || '',
    popularity: parseInt(songData.popularity) || 50,
    createdAt: songData.createdAt ? new Date(songData.createdAt) : new Date(),
    updatedAt: songData.updatedAt ? new Date(songData.updatedAt) : new Date(),
    youtubeId: songData.youtubeId || ''
  };
}

/**
 * Hata loglaması için JSON formatında log kaydı oluşturur
 * @param error Hata nesnesi
 * @param context Bağlam bilgisi
 * @returns JSON formatında log kaydı
 */
export function createErrorLog(error: Error, context: any): string {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  };
  
  return JSON.stringify(logEntry, null, 2);
}

/**
 * Hata logunu dosyaya kaydeder
 * @param logEntry Log kaydı
 * @param logFile Log dosyası
 */
export function saveErrorLog(logEntry: string, logFile: string = 'song_fix_errors.log'): void {
  try {
    fs.appendFileSync(logFile, logEntry + '\n');
  } catch (error) {
    console.error('Hata logu kaydedilirken hata oluştu:', error);
  }
}
