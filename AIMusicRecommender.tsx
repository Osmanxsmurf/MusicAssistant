import React, { useState } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import axios from 'axios';

export const AIMusicRecommender: React.FC = () => {
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const { play } = useSpotifyPlayer();

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood.trim()) return;

    setIsLoading(true);
    try {
      // Duygu analizi ve şarkı önerisi için AI endpoint'ini çağır
      const response = await axios.post('/api/ai_recommendations_advanced', {
        mood: mood,
        favorite_genres: [] // Kullanıcının favori türlerini buraya ekleyebiliriz
      });

      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayTrack = (trackUri: string) => {
    play(trackUri);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">AI Müzik Asistanı</h2>
      
      {/* Mood Input Form */}
      <form onSubmit={handleMoodSubmit} className="mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nasıl hissediyorsun?
            </label>
            <textarea
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Örneğin: Bugün çok mutluyum ve enerjik hissediyorum..."
              className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Öneriler Hazırlanıyor...' : 'Şarkı Önerileri Al'}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">Senin İçin Öneriler</h3>
          <div className="space-y-4">
            {recommendations.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={track.albumArt}
                    alt={track.name}
                    className="w-16 h-16 rounded"
                  />
                  <div>
                    <h4 className="font-medium">{track.name}</h4>
                    <p className="text-sm text-gray-400">
                      {track.artists.join(', ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePlayTrack(track.uri)}
                  className="p-2 text-green-500 hover:text-green-400"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Features Info */}
      <div className="mt-8 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">AI Özellikleri</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Duygu analizi ile kişiselleştirilmiş öneriler</li>
          <li>• Dinleme alışkanlıklarınıza göre öğrenme</li>
          <li>• Ruh halinize uygun şarkı seçimi</li>
          <li>• Benzer sanatçı ve şarkı önerileri</li>
        </ul>
      </div>
    </div>
  );
}; 