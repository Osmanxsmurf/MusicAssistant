export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  duration_ms: number;
  uri: string;
  preview_url: string | null;
  // createdAt?: Date;
  // updatedAt?: Date;
} 