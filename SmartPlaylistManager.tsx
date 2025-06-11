import React, { useState, useEffect } from 'react';

import { 
  createSmartPlaylist, 
  createTimeBasedPlaylist, 
  createMoodPlaylist, 
  SmartPlaylist, 
  PlaylistCriteria 
} from '../../lib/playlist/smart-playlist';
import { MoodType } from '../../lib/ai/context/mood-detector';
import { YouTubePlayer } from '../YouTubePlayer';
import { Box, Button, Card, CardContent, Typography, Grid, Chip, Avatar, List, ListItemButton, ListItemText, Divider, CircularProgress, TextField, MenuItem, IconButton } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, PlayArrow as PlayArrowIcon, Pause as PauseIcon, SkipNext as SkipNextIcon } from '@mui/icons-material';

interface SmartPlaylistManagerProps {
  userId: string;
}

const SmartPlaylistManager: React.FC<SmartPlaylistManagerProps> = ({ userId }) => {
  const [playlists, setPlaylists] = useState<SmartPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SmartPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistCriteria, setNewPlaylistCriteria] = useState<PlaylistCriteria>({
    moods: [],
    genres: [],
    includeUserFavorites: true
  });

  
  // İlk yükleme
  useEffect(() => {
    loadPlaylists();
  }, [userId]);
  
  // Playlist'leri yükle
  const loadPlaylists = async () => {
    setLoading(true);
    try {
      // Önce zamana göre bir çalma listesi oluştur
      const timeBasedPlaylist = await createTimeBasedPlaylist(userId);
      
      // Mevcut çalma listelerini veritabanından çek (burada mock olarak sadece yeni oluşturulanı kullanıyoruz)
      setPlaylists([timeBasedPlaylist]);
      
      // İlk playlist'i seç
      setSelectedPlaylist(timeBasedPlaylist);
    } catch (error) {
      console.error('Çalma listeleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Yeni çalma listesi oluştur
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName) return;
    
    setLoading(true);
    try {
      const newPlaylist = await createSmartPlaylist(
        userId,
        newPlaylistName,
        newPlaylistCriteria
      );
      
      setPlaylists([...playlists, newPlaylist]);
      setSelectedPlaylist(newPlaylist);
      setCreateMode(false);
      setNewPlaylistName('');
    } catch (error) {
      console.error('Çalma listesi oluşturulurken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Ruh haline göre çalma listesi oluştur
  const handleCreateMoodPlaylist = async (mood: MoodType) => {
    setLoading(true);
    try {
      const moodPlaylist = await createMoodPlaylist(userId, mood);
      setPlaylists([...playlists, moodPlaylist]);
      setSelectedPlaylist(moodPlaylist);
    } catch (error) {
      console.error('Ruh hali çalma listesi oluşturulurken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Çalma listesini yenile
  const handleRefreshPlaylist = async () => {
    if (!selectedPlaylist) return;
    
    setLoading(true);
    try {
      const refreshedPlaylist = await createSmartPlaylist(
        userId,
        selectedPlaylist.name,
        selectedPlaylist.criteria
      );
      
      // Playlists listesinde güncelle
      const updatedPlaylists = playlists.map(p => 
        p.id === selectedPlaylist.id ? refreshedPlaylist : p
      );
      
      setPlaylists(updatedPlaylists);
      setSelectedPlaylist(refreshedPlaylist);
      setCurrentSongIndex(0);
    } catch (error) {
      console.error('Çalma listesi yenilenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Sonraki şarkıya geç
  const handleNextSong = () => {
    if (!selectedPlaylist) return;
    
    const nextIndex = (currentSongIndex + 1) % selectedPlaylist.songs.length;
    setCurrentSongIndex(nextIndex);
  };
  
  // Çalma durumunu değiştir
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Mood seçim bileşeni
  const renderMoodSelector = () => {
    const moods = Object.values(MoodType);
    
    return (
      <Box mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          Ruh Haline Göre Çalma Listesi Oluştur
        </Typography>
        <Grid container spacing={1}>
          {moods.map((mood) => (
            <Grid key={mood}>
              <Chip
                label={mood}
                color="primary"
                onClick={() => handleCreateMoodPlaylist(mood as MoodType)}
                clickable
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  
  // Yeni çalma listesi oluşturma formu
  const renderCreateForm = () => {
    return (
      <Box mt={3} p={2} bgcolor="background.paper" borderRadius={1}>
        <Typography variant="h6" gutterBottom>
          Yeni Çalma Listesi Oluştur
        </Typography>
        
        <TextField
          fullWidth
          label="Çalma Listesi Adı"
          value={newPlaylistName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlaylistName(e.target.value)}
          margin="normal"
        />
        
        <TextField
          select
          fullWidth
          label="Ruh Hali"
          value={newPlaylistCriteria.moods?.[0] || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewPlaylistCriteria({
            ...newPlaylistCriteria,
            moods: e.target.value ? [e.target.value as MoodType] : []
          })}
          margin="normal"
        >
          {Object.values(MoodType).map((mood) => (
            <MenuItem key={mood} value={mood}>
              {mood}
            </MenuItem>
          ))}
        </TextField>
        
        <TextField
          fullWidth
          label="Türler (virgülle ayırın)"
          value={newPlaylistCriteria.genres?.join(', ') || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlaylistCriteria({
            ...newPlaylistCriteria,
            genres: e.target.value.split(',').map((g: string) => g.trim()).filter(Boolean)
          })}
          margin="normal"
        />
        
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button 
            variant="text" 
            onClick={() => setCreateMode(false)}
            sx={{ mr: 1 }}
          >
            İptal
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreatePlaylist}
            disabled={!newPlaylistName}
          >
            Oluştur
          </Button>
        </Box>
      </Box>
    );
  };
  
  if (loading && playlists.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Akıllı Çalma Listeleri
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Tercihlerinize ve ruh halinize göre özel olarak oluşturulan çalma listeleri
        </Typography>
      </Box>
      
      {renderMoodSelector()}
      
      <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          Çalma Listelerim
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={() => setCreateMode(true)}
        >
          Yeni Liste
        </Button>
      </Box>
      
      {createMode && renderCreateForm()}
      
      <Box mt={2}>
        <Grid container spacing={2}>
          {playlists.map((playlist) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: selectedPlaylist?.id === playlist.id ? 'action.selected' : 'background.paper'
                }}
                onClick={() => {
                  setSelectedPlaylist(playlist);
                  setCurrentSongIndex(0);
                }}
              >
                <Box 
                  sx={{ 
                    height: 140, 
                    backgroundImage: `url(${playlist.coverImage || 'https://via.placeholder.com/300'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      p: 1
                    }}
                  >
                    <Typography variant="h6" color="white">
                      {playlist.name}
                    </Typography>
                    <Typography variant="body2" color="white">
                      {playlist.songs.length} şarkı
                    </Typography>
                  </Box>
                </Box>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {playlist.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {selectedPlaylist && (
        <Box mt={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {selectedPlaylist.name}
            </Typography>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={handleRefreshPlaylist}
            >
              Yenile
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <List>
                {selectedPlaylist.songs.map((song, index) => (
                  <React.Fragment key={song.id}>
                    <ListItemButton
                      selected={index === currentSongIndex}
                      onClick={() => {
                        setCurrentSongIndex(index);
                        setIsPlaying(true);
                      }}
                    >
                      <Avatar sx={{ mr: 2, bgcolor: index === currentSongIndex ? 'primary.main' : 'grey.400' }}>
                        {index === currentSongIndex ? <PlayArrowIcon /> : (index + 1)}
                      </Avatar>
                      <ListItemText 
                        primary={song.title} 
                        secondary={song.artist} 
                      />
                    </ListItemButton>
                    {index < selectedPlaylist.songs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Grid>
            
            <Grid item xs={12} md={5}>
              {selectedPlaylist.songs.length > 0 && currentSongIndex < selectedPlaylist.songs.length && (
                <Box>
                  <YouTubePlayer
                    videoId={selectedPlaylist.songs[currentSongIndex].youtubeId || ''}
                    height="300px"
                    autoplay={isPlaying}
                  />
                  
                  <Box mt={2} display="flex" justifyContent="center">
                    <IconButton onClick={togglePlayPause} color="primary" size="large">
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <IconButton onClick={handleNextSong} color="primary" size="large">
                      <SkipNextIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default SmartPlaylistManager;
