import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getArtistInfo } from '@/lib/lastfm-api';
import { TrendingUp, Music, User, ExternalLink } from 'lucide-react';

interface ArtistDetailsProps {
  artistName: string;
  className?: string;
}

export function ArtistDetails({ artistName, className }: ArtistDetailsProps) {
  const [artistInfo, setArtistInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  
  useEffect(() => {
    if (!artistName) return;
    
    const loadArtistInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const info = await getArtistInfo(artistName);
        setArtistInfo(info);
      } catch (err) {
        console.error("Sanatçı bilgisi yüklenirken hata:", err);
        setError("Sanatçı bilgileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    
    loadArtistInfo();
  }, [artistName]);
  
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-40 w-40 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !artistInfo) {
    return (
      <Card className={`${className} bg-destructive/10 border-destructive/50`}>
        <CardHeader>
          <CardTitle>Hata</CardTitle>
          <CardDescription>Sanatçı bilgileri yüklenemedi.</CardDescription>
        </CardHeader>
        <CardContent>
          {error || "Bilinmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
        </CardContent>
      </Card>
    );
  }
  
  // HTML işaretlerini kaldır
  const cleanHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  };
  
  // İçerik kısaltma
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };
  
  const cleanedBio = artistInfo.biography ? cleanHtml(artistInfo.biography) : '';
  const cleanedSummary = artistInfo.summary ? cleanHtml(artistInfo.summary) : '';
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          {artistInfo.name}
        </CardTitle>
        <CardDescription>
          {artistInfo.tags && artistInfo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {artistInfo.tags.slice(0, 5).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="capitalize">{tag}</Badge>
              ))}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Sanatçı Resmi */}
          <div className="flex-shrink-0">
            {artistInfo.imageUrl ? (
              <img 
                src={artistInfo.imageUrl} 
                alt={artistInfo.name}
                className="w-40 h-40 object-cover rounded-md bg-muted"
              />
            ) : (
              <div className="w-40 h-40 bg-muted rounded-md flex items-center justify-center">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Sanatçı İstatistikleri */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Dinlenmeler
                </h3>
                <p className="text-xl font-bold">
                  {formatNumber(artistInfo.playcount || 0)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <User className="h-4 w-4 text-primary" />
                  Dinleyiciler
                </h3>
                <p className="text-xl font-bold">
                  {formatNumber(artistInfo.listeners || 0)}
                </p>
              </div>
            </div>
            
            {/* Kısa Biyografi */}
            {cleanedSummary && (
              <div>
                <h3 className="text-sm font-medium mb-1">Hakkında</h3>
                <p className="text-sm text-muted-foreground">
                  {cleanedSummary}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Tam Biyografi */}
        {cleanedBio && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Biyografi</h3>
            <div className="text-sm text-muted-foreground">
              {showFullBio ? cleanedBio : truncateText(cleanedBio, 500)}
              
              {cleanedBio.length > 500 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="px-0 h-auto font-medium"
                >
                  {showFullBio ? 'Daha az göster' : 'Devamını oku'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          Bilgi kaynağı: Last.fm
        </div>
        
        {artistInfo.url && (
          <a 
            href={artistInfo.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 text-primary hover:underline"
          >
            Last.fm'de görüntüle <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
