// React bileşeni
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Heart } from 'lucide-react';
import type { Song } from '@shared/schema';

interface SongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
  onLike?: (song: Song) => void;
  onClick?: () => void;
  isLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showArtist?: boolean;
  isCompact?: boolean;
}

export function SongCard({
  song,
  onPlay,
  onLike,
  onClick,
  isLiked = false,
  size = 'md',
  showArtist = true,
  isCompact = false
}: SongCardProps) {
  const sizeClasses = {
    sm: 'w-32',
    md: 'w-40',
    lg: 'w-48'
  };
  
  return (
    <Card 
      className={`overflow-hidden hover:bg-accent transition-colors cursor-pointer ${sizeClasses[size]} ${isCompact ? 'p-2' : ''}`}
      onClick={onClick}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {song.coverUrl ? (
          <img 
            src={song.imageUrl || song.coverImage} 
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="h-12 w-12 text-muted-foreground opacity-20" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
        )}
        
        <Button 
          size="icon" 
          className="absolute bottom-2 right-2 rounded-full h-8 w-8 bg-primary text-primary-foreground shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onPlay && onPlay(song);
          }}
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate text-sm">{song.title}</div>
            {showArtist && (
              <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
            )}
          </div>
          
          {onLike && (
            <Button 
              size="icon" 
              variant="ghost"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onLike(song);
              }}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
            </Button>
          )}
        </div>
        
        {song.mood && (
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge 
              variant="outline"
              className="text-xs px-1 capitalize"
            >
              {song.mood?.[0]}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
