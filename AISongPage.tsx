import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';

import { searchYouTube, getVideoDetails } from '../lib/youtube-api';
import * as LastfmAPI from '../lib/lastfm-api';
import { Song } from '@shared/schema';
import { useMusicPlayer } from '../contexts/music-player-context';
import { MoodDetector } from '../lib/ai/emotion/mood-detector';

interface PlayableVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt?: string; 
}

interface ExtendedSong extends Song {
  youtubeVideos?: PlayableVideo[];
  lastfmInfo?: LastfmAPI.LastfmTrack | null;
  similarSongs?: Song[];
}

const AISongPage: React.FC = () => {
  const params = useParams<{ songId: string }>();
  const songId = params?.songId;
  const [, navigate] = useLocation();
  const [song, setSong] = useState<ExtendedSong | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'similar'>('overview');
  const [aiInsights, setAiInsights] = useState<string>('');
  const { playSong: contextPlaySong } = useMusicPlayer();
  
  useEffect(() => {
    const loadSongData = async () => {
      if (!songId) {
        setError('Şarkı ID\'si belirtilmedi');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. YouTube'dan video detaylarını al (songId'nin YouTube Video ID olduğunu varsayıyoruz)
        const youtubeDetails = await getVideoDetails(songId);

        if (!youtubeDetails) {
          setError('Şarkı YouTube\'da bulunamadı');
          setLoading(false);
          return;
        }

        let artistName = youtubeDetails.channelTitle; // Default to channel title
        let trackTitle = youtubeDetails.title;

        const titleParts = youtubeDetails.title.split(' - ');
        if (titleParts.length >= 2) {
          artistName = titleParts[0].trim();
          trackTitle = titleParts.slice(1).join(' - ').trim();
        }
        
        const mainPlayableVideo: PlayableVideo = {
          videoId: youtubeDetails.videoId,
          title: youtubeDetails.title, // Use the full title from details for the main video item
          thumbnailUrl: youtubeDetails.thumbnailUrl,
          channelTitle: youtubeDetails.channelTitle,
          publishedAt: youtubeDetails.publishedAt,
        };

        const publishedDate = youtubeDetails.publishedAt ? new Date(youtubeDetails.publishedAt) : null;

        const partialSongData: ExtendedSong = {
          id: youtubeDetails.videoId, // Main ID for the song page
          title: trackTitle, // Parsed track title
          artist: artistName, // Parsed artist name
          album: '', 
          duration: 0, 
          genre: [], 
          moods: [], // Initialize moods as an empty array
          imageUrl: youtubeDetails.thumbnailUrl, // Main image for the song
          releaseDate: publishedDate ? publishedDate.toISOString().split('T')[0] : undefined, 
          year: publishedDate ? publishedDate.getFullYear() : undefined,
          youtubeId: youtubeDetails.videoId, 
          createdAt: publishedDate || new Date(), // If no publishedDate, use current date for createdAt
          updatedAt: new Date(),
          popularity: parseInt(youtubeDetails.viewCount || '0'),
          source: 'youtube',
          youtubeVideos: [mainPlayableVideo], 
        };

        // 2. Last.fm'den şarkı bilgilerini al
        const lastfmInfo = await LastfmAPI.getTrackInfo(partialSongData.artist, partialSongData.title);
        if (lastfmInfo) {
          partialSongData.lastfmInfo = lastfmInfo;
          partialSongData.album = lastfmInfo.album || partialSongData.album;
          partialSongData.duration = lastfmInfo.duration || partialSongData.duration;
          partialSongData.genre = lastfmInfo.tags || partialSongData.genre;
          partialSongData.imageUrl = lastfmInfo.imageUrl || partialSongData.imageUrl;
        }
        
        // 3. YouTube'dan ilgili diğer videoları al (ana video hariç)
        const relatedYoutubeResults = await searchYouTube(`${partialSongData.artist} ${partialSongData.title}`, 5);
        const relatedPlayableVideos: PlayableVideo[] = relatedYoutubeResults
          .filter(item => item.videoId !== youtubeDetails.videoId) // Ensure no duplicates of main video
          .map(item => ({
            videoId: item.videoId,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl || '', // searchResults have thumbnailUrl directly
            channelTitle: item.channelTitle || '', // searchResults have channelTitle directly
            publishedAt: item.publishedAt
          }));

        partialSongData.youtubeVideos = [
            mainPlayableVideo, 
            ...relatedPlayableVideos
        ];

        // 4. Benzer şarkıları al (Last.fm tabanlı)
        const similarSongsData = await fetchSimilarSongs(partialSongData);
        partialSongData.similarSongs = similarSongsData;

        // 5. Yapay zeka analizini yap
        const aiAnalysis = await generateAIInsights(partialSongData);
        setAiInsights(aiAnalysis);

        setSong(partialSongData);

      } catch (err) {
        console.error('Şarkı bilgileri yüklenirken hata:', err);
        setError('Şarkı bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    loadSongData();
  }, [songId]);
  
  // Benzer şarkıları getir
  const fetchSimilarSongs = async (currentSongData: Song): Promise<Song[]> => {
    try {
      // 1. Last.fm'den benzer şarkıları al
      const similarLastfmTracks = await LastfmAPI.getSimilarTracks(currentSongData.artist, currentSongData.title, 5);
      
      const similarSongsResult: Song[] = [];
      
      for (const track of similarLastfmTracks) {
        let youtubeIdForSimilar = '';
        try {
            const ytSearch = await searchYouTube(`${track.artist} ${track.name}`, 1);
            if (ytSearch.length > 0) {
                youtubeIdForSimilar = ytSearch[0].videoId;
            }
        } catch (ytError) {
            console.warn(`Could not fetch YouTube ID for similar track ${track.artist} - ${track.name}`, ytError);
        }

        similarSongsResult.push({
          id: youtubeIdForSimilar || `lastfm_${track.artist.replace(/\s/g, '_')}_${track.name.replace(/\s/g, '_')}`,
          title: track.name,
          artist: track.artist,
          album: track.album || '',
          duration: track.duration || 0,
          genre: track.tags || [],
          moods: [], // Initialize moods as an empty array
          imageUrl: track.imageUrl,
          youtubeId: youtubeIdForSimilar,
          releaseDate: undefined, 
          popularity: 0, 
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        if (similarSongsResult.length >= 5) break;
      }
      
      return similarSongsResult;
      
    } catch (error) {
      console.error('Benzer şarkılar alınırken hata:', error);
      return [];
    }
  };
  
  // AI tarafından içgörüler oluştur
  const generateAIInsights = async (songData: Song): Promise<string> => {
    try {
      // MoodDetector kullanarak şarkının ruh halini analiz et
      const moodDetector = new MoodDetector();
      const songMood = songData.moods && songData.moods.length > 0 
        ? songData.moods[0] 
        : moodDetector.detectMood(songData.title);
      
      // Şarkının türü ve ruh haline göre AI analizi oluştur
      const genre = Array.isArray(songData.genre) ? songData.genre.join(', ') : (songData.genre || 'Bilinmiyor');
      const year = songData.year || 'Bilinmiyor';
      
      let analysis = `"${songData.title}" ${songData.artist} tarafından seslendirilen`;
      
      if (year !== 'Bilinmiyor') {
        analysis += ` ${year} yılına ait`;
      }
      
      analysis += ` bir ${genre} şarkısıdır.`;
      
      if (songMood) {
        analysis += ` Bu şarkı genellikle ${songMood} ruh halinde dinleyicilere hitap eder.`;
        
        // Ruh haline göre ek açıklamalar
        const moodDescriptions: Record<string, string> = {
          happy: 'Neşeli ve pozitif enerjisi ile kendinizi iyi hissetmenizi sağlar.',
          sad: 'Melankolik tonu ve duygusal sözleri ile hüzünlü anlarınıza eşlik edebilir.',
          energetic: 'Yüksek temposu ve enerjik yapısı ile motivasyonunuzu artırabilir.',
          calm: 'Sakinleştirici melodisi ile rahatlama anlarınız için ideal bir seçimdir.',
          romantic: 'Romantik atmosferi ile özel anlarınıza eşlik edebilir.',
          angry: 'Güçlü vuruşları ve yoğun enerjisi ile içinizdeki duyguları dışa vurmanıza yardımcı olabilir.'
        };
        
        if (moodDescriptions[songMood]) {
          analysis += ` ${moodDescriptions[songMood]}`;
        }
      }
      
      // Sanatçı hakkında bilgi
      analysis += ` ${songData.artist}, ${genre} türünde tanınan bir sanatçıdır.`;
      
      return analysis;
      
    } catch (error) {
      console.error('AI içgörüleri oluşturulurken hata:', error);
      return 'Bu şarkı için AI içgörüleri şu anda hazırlanamadı.';
    }
  };

  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Şarkı bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (error || !song) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-6 rounded-lg text-red-800">
          <h2 className="text-xl font-bold mb-2">Hata</h2>
          <p>{error || 'Bilinmeyen bir hata oluştu'}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.history.back()}
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Şarkı Başlığı ve Kapak Resmi */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/3 mb-6 md:mb-0">
              {song.imageUrl ? (
                <img 
                  src={song.imageUrl} 
                  alt={`${song.title} by ${song.artist}`} 
                  className="w-64 h-64 object-cover rounded-lg shadow-lg mx-auto"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-300 rounded-lg shadow-lg flex items-center justify-center mx-auto">
                  <span className="text-gray-500">Resim Yok</span>
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 md:pl-8 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
              <h2 className="text-xl mb-4">{song.artist}</h2>
              
              <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                {Array.isArray(song.genre) && song.genre.map((g, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-700 bg-opacity-50 rounded-full text-sm">
                    {g}
                  </span>
                ))}
                
                {Array.isArray(song.moods) && song.moods.map((m: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-purple-700 bg-opacity-50 rounded-full text-sm">
                    {m}
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-4 justify-center md:justify-start">
                <button 
                  className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center"
                  onClick={() => { if (song) { contextPlaySong(song); } }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Çal
                </button>
                
                <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Detaylar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sekmeler */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('overview')}
            >
              Genel Bakış
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'videos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('videos')}
            >
              Videolar
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${activeTab === 'similar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('similar')}
            >
              Benzer Şarkılar
            </button>
          </nav>
        </div>
        
        {/* Sekme İçeriği */}
        <div className="p-6">
          {/* Genel Bakış */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Analizi */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                    </svg>
                    AI İçgörüleri
                  </span>
                </h3>
                <p className="text-blue-700">{aiInsights}</p>
              </div>
              
              {/* Şarkı Detayları */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Şarkı Detayları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Albüm</p>
                    <p className="font-medium">{song.album || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Yıl</p>
                    <p className="font-medium">{song.year || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Süre</p>
                    <p className="font-medium">
                      {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tür</p>
                    <p className="font-medium">
                      {Array.isArray(song.genre) ? song.genre.join(', ') : (song.genre || 'Belirtilmemiş')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Last.fm Bilgileri */}
              {song.lastfmInfo && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Last.fm Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Dinlenme Sayısı</p>
                      <p className="font-medium">{song.lastfmInfo.playcount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Dinleyici Sayısı</p>
                      <p className="font-medium">{song.lastfmInfo.listeners.toLocaleString()}</p>
                    </div>
                  </div>
                  {song.lastfmInfo.summary && (
                    <div className="mt-4">
                      <p className="text-gray-600">Özet</p>
                      <div className="mt-1" dangerouslySetInnerHTML={{ __html: song.lastfmInfo.summary }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Videolar */}
          {activeTab === 'videos' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">YouTube Videoları</h3>
              
              {song.youtubeVideos && song.youtubeVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {song.youtubeVideos.slice(0, 6).map((video, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg overflow-hidden shadow">
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.videoId}`}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-48"
                        ></iframe>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm line-clamp-2" title={video.title}>{video.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{video.channelTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Bu şarkı için video bulunamadı.</p>
              )}
            </div>
          )}
          
          {/* Benzer Şarkılar */}
          {activeTab === 'similar' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Benzer Şarkılar</h3>
              
              {song.similarSongs && song.similarSongs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {song.similarSongs.map((similarSong, index) => (
                    <div key={index} className="flex bg-gray-50 rounded-lg overflow-hidden shadow hover:bg-gray-100 transition-colors">
                      <div className="w-16 h-16 flex-shrink-0">
                        {similarSong.imageUrl ? (
                          <img 
                            src={similarSong.imageUrl} 
                            alt={similarSong.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Resim Yok</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1">
                        <h4 className="font-medium text-sm line-clamp-1" title={similarSong.title}>{similarSong.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{similarSong.artist}</p>
                        
                        <button 
                          className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          onClick={() => navigate(`/song/${similarSong.id}`)}
                        >
                          Görüntüle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Bu şarkı için benzer şarkı bulunamadı.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISongPage;
