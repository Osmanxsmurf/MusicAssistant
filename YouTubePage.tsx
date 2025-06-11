import React, { useState } from 'react';
import { searchYouTube } from '../lib/youtube-api';

const YouTubePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    try {
      const results = await searchYouTube(searchQuery);
      setSearchResults(results.items || []);
    } catch (error) {
      console.error('YouTube araması sırasında hata:', error);
      alert('Video arama işlemi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectVideo = (video: any) => {
    setSelectedVideo(video);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">YouTube Müzik Arama</h1>
      
      <div className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Şarkı veya sanatçı adı girin..."
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-red-600 text-white rounded-r-md hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`md:col-span-${selectedVideo ? '1' : '3'}`}>
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Arama Sonuçları</h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-gray-600">Sonuç bulunamadı. Lütfen başka bir arama yapın.</p>
            ) : (
              <div className="space-y-4">
                {searchResults.map((video) => (
                  <div 
                    key={video.id.videoId} 
                    className="flex p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="flex-shrink-0 w-24 h-auto">
                      <img 
                        src={video.snippet.thumbnails.medium.url} 
                        alt={video.snippet.title}
                        className="w-full h-auto object-cover rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">{video.snippet.title}</h3>
                      <p className="text-sm text-gray-600">{video.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {selectedVideo && (
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Seçilen Video</h2>
              
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}`}
                  title={selectedVideo.snippet.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-96"
                ></iframe>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium">{selectedVideo.snippet.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedVideo.snippet.channelTitle}</p>
                <p className="mt-2">{selectedVideo.snippet.description}</p>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Çalma Listesine Ekle
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                  Daha Fazla Bilgi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePage;
