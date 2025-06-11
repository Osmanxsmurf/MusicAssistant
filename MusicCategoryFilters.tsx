import React, { useState, useEffect } from 'react';
import { 
  TURKISH_GENRE_LABELS, 
  MOOD_LABELS, 
  ERA_LABELS, 
  REGIONAL_LABELS,
  CategoryLabel,
  applyMultipleFilters,
  getRecommendationsForCategory
} from '@/lib/ai/categories/music-categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MusicIcon, 
  HeartIcon, 
  ClockIcon, 
  MapPinIcon, 
  FilterIcon,
  XIcon,
  RefreshCw
} from 'lucide-react';
import { Song } from '@shared/schema';

interface MusicCategoryFiltersProps {
  onSongsSelected: (songs: Song[]) => void;
  initialSongs?: Song[];
}

export function MusicCategoryFilters({ onSongsSelected, initialSongs = [] }: MusicCategoryFiltersProps) {
  // Tüm şarkılar ve filtrelenmiş şarkılar
  const [allSongs, setAllSongs] = useState<Song[]>(initialSongs);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>(initialSongs);
  
  // Seçilen filtreler
  const [activeFilters, setActiveFilters] = useState<{
    genres: string[];
    moods: string[];
    eras: string[];
    regions: string[];
  }>({
    genres: [],
    moods: [],
    eras: [],
    regions: []
  });
  
  // Yükleniyor durumu
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtreleri uygula
  useEffect(() => {
    if (allSongs.length === 0) return;
    
    // Hiç filtre yoksa, tüm şarkıları göster
    const hasActiveFilters = Object.values(activeFilters).some(filters => filters.length > 0);
    if (!hasActiveFilters) {
      setFilteredSongs(allSongs);
      onSongsSelected(allSongs);
      return;
    }
    
    // Filtreleri uygula
    const result = applyMultipleFilters(allSongs, activeFilters);
    setFilteredSongs(result);
    onSongsSelected(result);
  }, [allSongs, activeFilters, onSongsSelected]);
  
  // Filtre ekle/kaldır
  const toggleFilter = (filterType: keyof typeof activeFilters, filterId: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...prev[filterType]];
      const filterIndex = currentFilters.indexOf(filterId);
      
      if (filterIndex === -1) {
        // Filtre henüz ekli değilse ekle
        return {
          ...prev,
          [filterType]: [...currentFilters, filterId]
        };
      } else {
        // Filtre zaten ekliyse kaldır
        currentFilters.splice(filterIndex, 1);
        return {
          ...prev,
          [filterType]: currentFilters
        };
      }
    });
  };
  
  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setActiveFilters({
      genres: [],
      moods: [],
      eras: [],
      regions: []
    });
  };
  
  // Kategori için öneriler yükle
  const loadRecommendationsForCategory = async (categoryId: string) => {
    setIsLoading(true);
    try {
      const recommendations = await getRecommendationsForCategory(categoryId, 20);
      setAllSongs(recommendations);
      setFilteredSongs(recommendations);
      onSongsSelected(recommendations);
    } catch (error) {
      console.error('Kategori önerileri yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kategori etiketlerini render et
  const renderCategoryLabels = (categories: CategoryLabel[], filterType: keyof typeof activeFilters) => {
    return categories.map(category => {
      const isActive = activeFilters[filterType].includes(category.id);
      
      return (
        <Badge
          key={category.id}
          variant={isActive ? "default" : "outline"}
          className={`
            cursor-pointer m-1 py-2 px-3 transition-all
            ${isActive ? 'hover:bg-primary/80' : 'hover:bg-primary/20'}
          `}
          style={{ 
            backgroundColor: isActive ? category.color : 'transparent',
            borderColor: category.color,
            color: isActive ? 'white' : category.color
          }}
          onClick={() => toggleFilter(filterType, category.id)}
        >
          {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.label}
        </Badge>
      );
    });
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Müzik Kategorileri ve Filtreler
          </div>
          
          {Object.values(activeFilters).some(filters => filters.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="h-8 px-2"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Filtreleri Temizle
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="genres">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="genres" className="flex items-center">
              <MusicIcon className="h-4 w-4 mr-2" />
              Türler
            </TabsTrigger>
            <TabsTrigger value="moods" className="flex items-center">
              <HeartIcon className="h-4 w-4 mr-2" />
              Ruh Halleri
            </TabsTrigger>
            <TabsTrigger value="eras" className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              Dönemler
            </TabsTrigger>
            <TabsTrigger value="regions" className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Bölgeler
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="genres">
            <ScrollArea className="h-44 rounded-md border p-4">
              <div className="flex flex-wrap">
                {renderCategoryLabels(TURKISH_GENRE_LABELS, 'genres')}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="moods">
            <ScrollArea className="h-44 rounded-md border p-4">
              <div className="flex flex-wrap">
                {renderCategoryLabels(MOOD_LABELS, 'moods')}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="eras">
            <ScrollArea className="h-44 rounded-md border p-4">
              <div className="flex flex-wrap">
                {renderCategoryLabels(ERA_LABELS, 'eras')}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="regions">
            <ScrollArea className="h-44 rounded-md border p-4">
              <div className="flex flex-wrap">
                {renderCategoryLabels(REGIONAL_LABELS, 'regions')}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Aktif filtreler özeti */}
        {Object.values(activeFilters).some(filters => filters.length > 0) && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Aktif Filtreler:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(activeFilters).map(([filterType, filters]) => (
                filters.map(filterId => {
                  let label = '';
                  let icon = '';
                  let color = '';
                  
                  // Filtre tipine göre doğru etiketi bul
                  if (filterType === 'genres') {
                    const genre = TURKISH_GENRE_LABELS.find(g => g.id === filterId);
                    if (genre) {
                      label = genre.label;
                      icon = genre.icon || '';
                      color = genre.color || '';
                    }
                  } else if (filterType === 'moods') {
                    const mood = MOOD_LABELS.find(m => m.id === filterId);
                    if (mood) {
                      label = mood.label;
                      icon = mood.icon || '';
                      color = mood.color || '';
                    }
                  } else if (filterType === 'eras') {
                    const era = ERA_LABELS.find(e => e.id === filterId);
                    if (era) {
                      label = era.label;
                      icon = era.icon || '';
                      color = era.color || '';
                    }
                  } else if (filterType === 'regions') {
                    const region = REGIONAL_LABELS.find(r => r.id === filterId);
                    if (region) {
                      label = region.label;
                      icon = region.icon || '';
                      color = region.color || '';
                    }
                  }
                  
                  if (!label) return null;
                  
                  return (
                    <Badge
                      key={`${filterType}-${filterId}`}
                      variant="secondary"
                      style={{ backgroundColor: color, color: 'white' }}
                      className="cursor-pointer flex items-center gap-1"
                      onClick={() => toggleFilter(filterType as keyof typeof activeFilters, filterId)}
                    >
                      {icon && <span>{icon}</span>}
                      {label}
                      <XIcon className="h-3 w-3 ml-1" />
                    </Badge>
                  );
                })
              ))}
            </div>
          </div>
        )}
        
        {/* Filtrelerin sonucu */}
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {isLoading 
              ? 'Şarkılar yükleniyor...' 
              : `${filteredSongs.length} şarkı bulundu`
            }
          </p>
          
          <Button 
            size="sm" 
            onClick={() => clearAllFilters()}
            disabled={isLoading || Object.values(activeFilters).every(filters => filters.length === 0)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sıfırla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
