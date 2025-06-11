import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, ExternalLink, Heart, Clock, Music } from 'lucide-react';
import type { Song } from '@shared/schema';

interface SongTableProps {
  songs: Song[];
  title?: string;
  showArtist?: boolean;
  showViewAll?: boolean;
  viewAllUrl?: string;
  onSongClick?: (song: Song) => void;
  emptyMessage?: string;
  maxItems?: number;
}

export function SongTable({
  songs,
  title = 'Şarkılar',
  showArtist = true,
  showViewAll = true,
  viewAllUrl = '/songs',
  onSongClick,
  emptyMessage = 'Henüz şarkı bulunamadı.',
  maxItems = 10
}: SongTableProps) {
  const [_, navigate] = useLocation();
  const displaySongs = songs.slice(0, maxItems);
  
  // Şarkı süresini formatla (saniye -> mm:ss)
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Şarkıya tıklandığında
  const handleSongClick = (song: Song) => {
    if (onSongClick) {
      onSongClick(song);
    } else {
      // Varsayılan olarak şarkı sayfasına yönlendir
      navigate(`/song?id=${song.id}`);
    }
  };
  
  // Sanatçıya tıklandığında
  const handleArtistClick = (e: React.MouseEvent, artistName: string) => {
    e.stopPropagation(); // Şarkı tıklamasını engelle
    navigate(`/artist?name=${encodeURIComponent(artistName)}`);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          
          {showViewAll && songs.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(viewAllUrl)}
              className="text-xs"
            >
              Tümünü Gör
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {songs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Şarkı</TableHead>
                  {showArtist && <TableHead>Sanatçı</TableHead>}
                  <TableHead>Tür</TableHead>
                  <TableHead className="w-24 text-right">Süre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySongs.map((song, index) => (
                  <TableRow 
                    key={song.id || index}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSongClick(song)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                        {index + 1}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {song.imageUrl ? (
                            <img 
                              src={song.imageUrl} 
                              alt={song.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium">{song.title}</div>
                          {song.album && (
                            <div className="text-xs text-muted-foreground">{song.album}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    {showArtist && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-sm font-normal"
                          onClick={(e) => handleArtistClick(e, song.artist)}
                        >
                          {song.artist}
                        </Button>
                      </TableCell>
                    )}
                    
                    <TableCell>
                      {song.genre?.map((g, i) => (
                        <Badge 
                          key={i} 
                          variant="outline"
                          className="mr-1 capitalize"
                        >
                          {g}
                        </Badge>
                      ))}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-muted-foreground text-sm">
                          {formatDuration(song.duration || 0)}
                        </span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Favorilere ekleme işlevi buraya eklenebilir
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
