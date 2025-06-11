import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Send, User, RefreshCw } from 'lucide-react';
import { getEnhancedMusicAI, ProcessQueryResult } from '@/lib/ai/enhanced-music-ai';
import { Song } from '@/lib/types/music-types';
import { AIRecommendationsPlayer } from '@/components/AIRecommendationsPlayer';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  songs?: Song[];
  playableResults?: boolean;
}

interface EnhancedMusicAssistantProps {
  onSongsRecommended?: (songs: Song[] | undefined) => void;
}

export function EnhancedMusicAssistant({ onSongsRecommended }: EnhancedMusicAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Merhaba! Ben sizin gelişmiş müzik asistanınızım. Size şarkı önerebilir, çalabilir veya müzik hakkında bilgi verebilirim. Nasıl yardımcı olabilirim?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Kullanıcı kimliğini oluştur veya getir
  useEffect(() => {
    const storedUserId = localStorage.getItem('musicAssistantUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}`;
      localStorage.setItem('musicAssistantUserId', newUserId);
      setUserId(newUserId);
    }
  }, []);
  
  // Mesajların en altına otomatik kaydırma
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Mesaj gönderme
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Yapay zeka motorunu kullan
      const ai = getEnhancedMusicAI();
      const response: ProcessQueryResult = await ai.processQuery(inputMessage, userId);
      
      // Asistan yanıtını ekle
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        songs: response.songs,
        playableResults: response.playableResults
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Önerilen şarkıları üst bileşene bildir
      if (onSongsRecommended && response.songs) {
        onSongsRecommended(response.songs);
      }
    } catch (error) {
      console.error('Yapay zeka yanıt üretirken hata:', error);
      
      // Hata mesajı ekle
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Bağlantı Hatası',
        description: 'Müzik asistanı şu anda yanıt veremiyor. Lütfen daha sonra tekrar deneyin.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Öneri üzerine tıklama
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };
  
  // Haftalık müzik özetini getir
  const handleGetWeeklySummary = async () => {
    setIsLoading(true);
    
    try {
      const ai = getEnhancedMusicAI();
      // TypeScript hatasını düzeltmek için any tipine dönüştürüyoruz
      const summary = await (ai as any).generateWeeklySummary(userId);
      
      const summaryContent = `
        # Haftalık Müzik Özetin
        
        ## En Çok Dinlediğin Sanatçılar
        ${summary.topArtists.map((artist: string) => `- ${artist}`).join('\n')}
        
        ## Favori Müzik Türlerin
        ${summary.topGenres.map((genre: string) => `- ${genre}`).join('\n')}
        
        ## Baskın Ruh Halin
        ${summary.dominantMood}
        
        ## Bu Haftanın Önerileri
        ${summary.recommendedSongs.slice(0, 5).map((song: Song, i: number) => `${i + 1}. "${song.title}" - ${song.artist}`).join('\n')}
      `;
      
      const summaryMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: summaryContent,
        timestamp: new Date(),
        songs: summary.recommendedSongs
      };
      
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Haftalık özet oluşturulurken hata:', error);
      
      toast({
        title: 'Özet Oluşturulamadı',
        description: 'Haftalık müzik özetiniz şu anda oluşturulamıyor. Lütfen daha sonra tekrar deneyin.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          Gelişmiş Müzik Asistanı
          <Sparkles className="w-4 h-4 ml-2 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="overflow-y-auto flex-grow">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 mt-1">
                  {message.role === 'assistant' && (
                    <><AvatarImage src="/ai-assistant-avatar.jpg" /><AvatarFallback><Sparkles className="w-5 h-5" /></AvatarFallback></>
                  )}
                  {message.role === 'user' && (
                    <><AvatarImage src="/user-avatar.jpg" /><AvatarFallback><User className="w-5 h-5" /></AvatarFallback></>
                  )}
                </Avatar>
                <div className="flex flex-col gap-2 min-w-0 w-full">
                  <div className="bg-primary-foreground rounded-lg p-4 text-sm">
                    {message.content}
                  </div>
                  
                  {message.songs && message.songs.length > 0 && (
                    <div className="bg-primary-foreground rounded-lg p-4 text-sm w-full">
                      {/* Şarkı listesi ve çalma özelliği */}
                      <AIRecommendationsPlayer 
                        songs={message.songs} 
                        playableResults={message.playableResults}
                        className="w-full" 
                      />
                      
                      {/* Eğer player görüntülenmediyse basit liste göster */}
                      {!message.playableResults && (
                        <>
                          <div className="font-medium mt-3">Önerilen Şarkılar:</div>
                          <ul className="list-disc ml-5 mt-2 space-y-1">
                            {message.songs.slice(0, 5).map((song, index) => (
                              <li key={index}>
                                {song.title} - {song.artist}
                              </li>
                            ))}
                          </ul>
                          {message.songs.length > 5 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              +{message.songs.length - 5} daha fazla şarkı
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full space-y-3">
          {/* Öneri butonları */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleSuggestionClick("Bugün ne dinleyebilirim?")}
            >
              Bugün ne dinleyebilirim?
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleSuggestionClick("Enerjik şarkılar öner")}
            >
              Enerjik şarkılar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleSuggestionClick("En iyi Türkçe pop şarkıları")}
            >
              Türkçe pop
            </Button>
            <div className="flex items-center">
              <Button
                className="ml-auto"
                size="sm"
                variant="ghost"
                onClick={handleGetWeeklySummary}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Haftalık özet
              </Button>
            </div>
          </div>
          
          {/* Mesaj girişi */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Bir mesaj yazın..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Gönder</span>
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
}
