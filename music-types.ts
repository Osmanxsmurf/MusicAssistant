/**
 * Müzik uygulaması için temel tip tanımlamaları
 */

/**
 * Şarkı arayüzü - bir müzik parçasını temsil eder
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  genre?: string[] | undefined; 
  album?: string;
  coverImage?: string;
  imageUrl?: string; 
  releaseYear?: number;
  duration?: number;
  youtubeId?: string; 
  youtubeUrl?: string; 
  mood?: string[] | undefined; 
  year?: number; 
  createdAt: Date; 
  updatedAt: Date; 
}
