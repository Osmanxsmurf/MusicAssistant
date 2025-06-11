import React, { useState, useEffect, useRef } from 'react';
import { processUserMessage, searchSongs } from '../../lib/ai/ai-api';
import { AIResponse } from '../../lib/ai/ai-engine';
import { Song } from '@shared/schema';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  songs?: Song[];
  artists?: any[];
  playlists?: any[];
}

interface YouTubePlayer {
  videoId: string;
  title: string;
  artist: string;
}

const MusicAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<YouTubePlayer | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Oluşturulan kullanıcı kimliğini kullan veya yeni oluştur
  useEffect(() => {
    const storedUserId = localStorage.getItem('musicAssistantUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}`;
      localStorage.setItem('musicAssistantUserId', newUserId);
      setUserId(newUserId);
    }
    
    // Hoş geldin mesajı ekle
    setMessages([
      {
        id: 'welcome',
        text: 'Merhaba! Müzik asistanınız burada. Size nasıl yardımcı olabilirim? Şarkı arayabilir, çalabilir veya ruh halinize göre öneriler alabilirim.',
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Mesajlar güncellendiğinde otomatik kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Arama yap
  const handleSearch = async () => {
    if (!searchQuery.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Doğrudan arama fonksiyonunu çağır
      const searchResponse = await searchSongs(searchQuery, 10);
      
      // Arama mesajı oluştur
      const searchMessage: Message = {
        id: `search_${Date.now()}`,
        text: `"${searchQuery}" için arama sonuçları:`,
        sender: 'assistant',
        timestamp: new Date(),
        songs: searchResponse.songs
      };
      
      setMessages(prev => [...prev, searchMessage]);
      setSearchQuery('');
      
    } catch (error) {
      console.error('Arama hatası:', error);
      
      // Hata mesajı ekle
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'Üzgünüm, arama yaparken bir sorun oluştu. Lütfen tekrar deneyin.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Arama modu değiştir
  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    setInputValue('');
    setSearchQuery('');
  };

  // Kullanıcı mesajını işle
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    try {
      // AI'dan yanıt al
      const response = await processUserMessage(userId, inputValue);
      handleAIResponse(response);
    } catch (error) {
      console.error('Mesaj işleme hatası:', error);
      
      // Hata mesajı ekle
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'Üzgünüm, mesajınızı işlerken bir sorun oluştu. Lütfen tekrar deneyin.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI yanıtını işle
  const handleAIResponse = (response: AIResponse) => {
    // Asistan mesajını ekle
    const assistantMessage: Message = {
      id: `assistant_${Date.now()}`,
      text: response.text,
      sender: 'assistant',
      timestamp: new Date(),
      songs: response.songs,
      artists: response.artists,
      playlists: response.playlists
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Önerilen eylemleri işle (gerekirse)
    if (response.suggestedActions && response.suggestedActions.length > 0) {
      // Burada önerilen eylemler için özel işleyiciler eklenebilir
      // Örneğin, şarkı çalma, arama sonuçlarını gösterme vb.
    }
  };

  // Enter tuşuna basıldığında gönder
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isSearchMode) {
        handleSearch();
      } else {
        handleSendMessage();
      }
    }
  };

  // Şarkıları görüntüle
  const renderSongs = (songs?: Song[]) => {
    if (!songs || songs.length === 0) return null;
    
    return (
      <div className="songs-container mt-2">
        <p className="text-sm font-medium">Şarkılar:</p>
        <div className="song-list space-y-2 mt-1">
          {songs.slice(0, 5).map((song, index) => (
            <div 
              key={index} 
              className="song-item bg-blue-50 p-3 rounded-md cursor-pointer hover:bg-blue-100 transition-colors flex justify-between items-center"
              onClick={() => handleSongClick(song)}
            >
              <div>
                <p className="font-medium">{song.title}</p>
                <p className="text-sm text-gray-600">{song.artist}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="text-green-600 hover:text-green-800 flex items-center bg-green-100 px-2 py-1 rounded"
                  onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Çal</span>
                </button>
                <button 
                  className="text-red-500 hover:text-red-700 flex items-center bg-red-50 px-2 py-1 rounded"
                  onClick={(e) => { e.stopPropagation(); handleYouTubeSearch(song); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  <span>YouTube</span>
                </button>
              </div>
            </div>
          ))}
          {songs.length > 5 && (
            <div className="text-sm text-blue-600 p-2">
              +{songs.length - 5} daha fazla şarkı
            </div>
          )}
        </div>
      </div>
    );
  };

  // Şarkıya tıklama - Şarkı detaylarını göster
  const handleSongClick = (song: Song) => {
    // Şarkı detaylarını gösterecek yeni bir mesaj ekle
    const songDetailsMessage: Message = {
      id: `song_details_${Date.now()}`,
      text: `Şarkı Detayları:\n- Başlık: ${song.title}\n- Sanatçı: ${song.artist}\n- Tür: ${song.genre || 'Bilinmiyor'}`,
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, songDetailsMessage]);
  };
  
  // Şarkıyı YouTube'da aç (yeni sekmede)
  const handleYouTubeSearch = (song: Song) => {
    const searchQuery = `${song.artist} ${song.title}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    window.open(`https://www.youtube.com/results?search_query=${encodedQuery}`, '_blank');
  };
  
  // Şarkıyı çal (İç oynatıcıda)
  const handlePlaySong = (song: Song) => {
    // YouTube Data API olmadan, en iyi şekilde eşleştirme yaparak videoId oluşturuyoruz
    // Gerçek uygulamada, YouTube API kullanarak daha doğru sonuçlar elde edilebilir
    const searchQuery = `${song.artist} ${song.title} official`;
    
    // Video kimliği olarak, arama sorgusu kullanıyoruz (demo amaçlı)
    // Bu, YouTube'un otomatik olarak en iyi eşleşmeyi bulmasını sağlar
    setCurrentPlayer({
      videoId: encodeURIComponent(searchQuery),
      title: song.title,
      artist: song.artist
    });
    
    // Şarkı çalma bildirimi gönder
    const playingMessage: Message = {
      id: `playing_${Date.now()}`,
      text: `Şu an çalınıyor: ${song.title} - ${song.artist}`,
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, playingMessage]);
  };

  // YouTube oynatıcı bileşenini kapat
  const closePlayer = () => {
    setCurrentPlayer(null);
  };

  return (
    <div className="music-assistant flex flex-col h-full max-h-[600px] rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="assistant-header p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Müzik Asistanı</h2>
        <button 
          onClick={toggleSearchMode}
          className={`px-3 py-1 rounded-md flex items-center ${
            isSearchMode 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearchMode ? 'Normal Mod' : 'Arama Modu'}
        </button>
      </div>
      
      {/* YouTube Oynatıcı */}
      {currentPlayer && (
        <div className="youtube-player-container p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Şu an çalınıyor: {currentPlayer.title} - {currentPlayer.artist}</h3>
            <button 
              onClick={closePlayer}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="relative pb-[56.25%] h-0 overflow-hidden bg-gray-100 rounded">
            <iframe 
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed?search=${currentPlayer.videoId}&autoplay=1`}
              title={`${currentPlayer.title} by ${currentPlayer.artist}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      
      <div className="messages-container flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              <p>{message.text}</p>
              {message.sender === 'assistant' && renderSongs(message.songs)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container p-4 border-t border-gray-200">
        <div className="flex items-center">
          {isSearchMode ? (
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Şarkı, sanatçı veya albüm ara..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleSearch}
                className={`p-2 text-white rounded-r-md ${
                  isProcessing || !searchQuery.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={isProcessing || !searchQuery.trim()}
              >
                {isProcessing ? (
                  <span className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Ara</span>
                )}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Bir mesaj yazın..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendMessage}
                className={`p-2 text-white rounded-r-md ${
                  isProcessing || !inputValue.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={isProcessing || !inputValue.trim()}
              >
                {isProcessing ? (
                  <span className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Gönder</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicAssistant;
