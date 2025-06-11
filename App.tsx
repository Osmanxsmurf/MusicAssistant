import { Router, Route, Switch } from "wouter";
import { SpotifyProvider } from './contexts/SpotifyContext';
import { AssistantProvider } from './contexts/AssistantContext';
import Layout from "./components/Layout"; 
import HomePage from './pages/HomePage';
import { ArtistDetail } from './pages/ArtistDetail';

// Gelecekte eklenecek diğer sayfalar için örnekler:
// import DiscoverPage from './pages/DiscoverPage';
// import AiPage from './pages/AiPage';

function App() {
  return (
    <SpotifyProvider>
      <AssistantProvider>
        <Layout> {/* Layout artık Router'ı ve içeriği sarmalıyor */}
          <Router> {/* wouter'dan gelen Router */}
            <Switch> {/* Yalnızca ilk eşleşen Route'u render eder */}
              <Route path="/" component={HomePage} />
              <Route path="/artist/:artistId" component={ArtistDetail} />
              
              {/* 
                Layout.tsx içindeki navItems için gelecekte eklenecek route'lar:
                <Route path="/discover" component={DiscoverPage} />
                <Route path="/artist" component={() => <div>Sanatçılar Sayfası</div>} />
                <Route path="/songs" component={() => <div>Şarkılar Sayfası</div>} />
                <Route path="/ai" component={AiPage} />
                <Route path="/search" component={() => <div>Arama Sayfası</div>} />
                <Route path="/favorites" component={() => <div>Favoriler Sayfası</div>} />
                <Route path="/profile" component={() => <div>Profil Sayfası</div>} />
                <Route path="/settings" component={() => <div>Ayarlar Sayfası</div>} />
              */}

              {/* Varsayılan 404 Rotası */}
              <Route>
                <div className="flex items-center justify-center h-full">
                  <h1 className="text-2xl">404: Sayfa Bulunamadı</h1>
                </div>
              </Route>
            </Switch>
          </Router>
        </Layout>
      </AssistantProvider>
    </SpotifyProvider>
  );
}

export default App;
