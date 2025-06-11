import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, X, Minimize, Maximize } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import axios from 'axios';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  action?: {
    type: string;
    payload: any;
  };
}

interface AIAssistantProps {
  title?: string;
  onPlayVideoRequest?: (videoId: string) => void;
  onPauseRequest?: () => void;
  onPlayRequest?: () => void;
  onSeekForwardRequest?: (seconds: number) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  title = "Marjinal Asistan",
  onPlayVideoRequest,
  onPauseRequest,
  onPlayRequest,
  onSeekForwardRequest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { play } = useSpotifyPlayer();

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai_chat', {
        message: input
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.text,
        sender: 'assistant',
        action: response.data.action
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Eğer bir şarkı çalma aksiyonu varsa
      if (assistantMessage.action?.type === 'PLAY_SONG') {
        play(assistantMessage.action.payload.uri);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        sender: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Asistan düğmesi */}
      {!isOpen && (
        <Button 
          onClick={toggleAssistant}
          className="rounded-full bg-primary shadow-lg hover:bg-primary/90"
          size="icon"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}
      
      {/* Asistan arayüzü */}
      {isOpen && (
        <Card className={`w-80 shadow-lg transition-all duration-200 ${isMinimized ? 'h-12' : 'h-96'}`}>
          <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 border-b">
            <CardTitle className="text-sm font-medium">
              <span className="text-primary">{title}</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleAssistant}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <>
              <CardContent className="p-3 flex flex-col h-[calc(100%-60px)]">
                {/* Sohbet alanı */}
                <div className="flex-1 overflow-y-auto mb-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <p className="text-sm text-muted-foreground">
                        Marjinal'e bir şey sor...
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`p-2 rounded-lg text-sm ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground ml-8' 
                            : 'bg-muted mr-8'
                        }`}
                      >
                        {message.text}
                        {message.action && (
                          <div className="mt-2 text-xs opacity-75">
                            {message.action.type === 'PLAY_SONG' && (
                              <span>🎵 Şarkı çalınıyor: {message.action.payload.name}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                {/* Mesaj giriş alanı */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Marjinal'e bir şey sor..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                    className="text-sm"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="sm"
                  >
                    Gönder
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default AIAssistant;
