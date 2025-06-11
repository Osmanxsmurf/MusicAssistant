import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MoodProvider } from './lib/ai/context/MoodContext';
import { SpotifyAuthProvider } from './context/SpotifyAuthContext'; // SpotifyAuthProvider import edildi
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SpotifyAuthProvider> {/* SpotifyAuthProvider eklendi */}
      <MoodProvider>
        <App />
      </MoodProvider>
    </SpotifyAuthProvider>
  </React.StrictMode>,
);
