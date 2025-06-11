import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSpotifyAuth } from '@/context/SpotifyAuthContext';

const SpotifyCallbackPage = () => {
  const { isLoading, error, isAuthenticated, exchangeCodeForToken } = useSpotifyAuth();
  const [, setLocation] = useLocation(); // wouter's setLocation for SPA navigation
  const [processedCode, setProcessedCode] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');

    // URL'yi hemen temizle
    window.history.replaceState({}, document.title, window.location.pathname);

    if (errorParam) {
      console.error('Spotify OAuth Error on callback:', errorParam);
      // SpotifyAuthContext zaten bu hatayı yakalayıp setError ile state'e yazmalı.
      // Burada ek bir işlem yapmaya gerek yok, aşağıdaki useEffect yönlendirmeyi halleder.
      return; // Hata varsa başka bir işlem yapma
    }

    if (code && code !== processedCode) {
      console.log('SpotifyCallbackPage: Authorization code found:', code);
      setProcessedCode(code); // Bu kodun işlendiğini işaretle
      exchangeCodeForToken(code).catch(err => {
        // Hata zaten context içinde setError ile yönetiliyor olmalı.
        console.error('SpotifyCallbackPage: Error during token exchange:', err);
      });
    } else if (!code && !errorParam) {
      console.warn('SpotifyCallbackPage: No authorization code or error parameter found in callback URL.');
    }
  }, [exchangeCodeForToken, processedCode, setLocation]); // Bağımlılıkları kontrol et

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('SpotifyCallbackPage: Authentication successful. Redirecting to localhost:3000...');
        // Kullanıcıyı localhost:3000'e yönlendir.
        // ÖNEMLİ: Bu, farklı bir origin'e yönlendirme olduğu için localStorage'daki token'lar
        // doğrudan erişilemeyebilir. Eğer bu sorun olursa, bu yönlendirme yerine
        // setLocation('/', { replace: true }); kullanılabilir ve tüm uygulama 127.0.0.1'de çalıştırılabilir.
        setLocation('/', { replace: true }); // Redirect to home page on the same origin 
      } else if (error) {
        console.error('SpotifyCallbackPage: Authentication failed. Redirecting to / (127.0.0.1:3000). Error:', error);
        // Hata durumunda uygulamanın ana sayfasına (127.0.0.1:3000) yönlendir.
        setLocation('/', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, error, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground">
      {isLoading && <p className="text-lg">Spotify ile kimlik doğrulanıyor...</p>}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          <span className="font-medium">Hata:</span> {error}
        </div>
      )}
      {/* loading -> isLoading */}
      {!isLoading && !error && !isAuthenticated && (
        <p>Yönlendirme bekleniyor...</p>
      )}
    </div>
  );
};

export default SpotifyCallbackPage;
