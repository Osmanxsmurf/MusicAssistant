# MusicAssistant# Marjinal Müzik Asistanı

Marjinal Müzik Asistanı, kullanıcılara kişiselleştirilmiş bir müzik keşfi ve dinleme deneyimi sunan, yapay zeka destekli **Full-Stack** bir web uygulamasıdır. Spotify, Last.fm ve YouTube gibi popüler müzik servisleriyle entegre çalışarak, doğal dil komutlarını anlayan ve kullanıcının ruh haline göre müzik önerileri sunan bir asistana sahiptir.

## ✨ Temel Özellikler

*   **Yapay Zeka Asistanı (Orchestrator):**
    *   **Backend Odaklı Zeka:** Tüm yapay zeka mantığı, Python tabanlı **FastAPI** sunucusunda yönetilir.
    *   **Duygu Analizi:** Hugging Face Inference API kullanarak kullanıcının yazdığı metinlerden duygu tespiti yapar.
    *   **Niyet Tanıma:** Kullanıcı komutlarını anlayarak ilgili eylemleri (şarkı arama, sanatçı bilgisi getirme vb.) tetikler.

*   **Spotify Entegrasyonu:**
    *   **Güvenli Kimlik Doğrulama:** Güvenlik ve stabilite için tüm Spotify OAuth 2.0 akışı, sunucu tarafında (backend) yönetilir. Token'lar, güvenli HTTPOnly çerezlerinde saklanan sunucu oturumlarında (sessions) tutulur.
    *   **Kişiselleştirilmiş İçerik:** Kullanıcının profil bilgilerini, çalma listelerini ve Spotify'ın önerilerini görüntüleme.
    *   **Playback Kontrolü:** Aktif cihazlarda şarkı başlatma ve çalma listesi yönetimi.

*   **Diğer Servis Entegrasyonları:**
    *   **Last.fm:** Sanatçı biyografileri ve popüler parçalar hakkında bilgi sağlar.
    *   **YouTube:** İlgili şarkıların video kliplerini bulur ve gösterir.

## 🛠️ Kullanılan Teknolojiler

| Kategori      | Teknoloji                                       |
|---------------|-------------------------------------------------|
| **Backend**   | Python, FastAPI, SQLAlchemy, Uvicorn            |
| **Frontend**  | React (Vite), TypeScript, Tailwind CSS          |
| **Veritabanı**| PostgreSQL                                      |
| **AI / ML**   | Hugging Face (Sentiment Analysis)               |
| **API'ler**   | Spotify Web API, Last.fm API, YouTube Data API  |
| **State Mgmt**| React Context API                               |

## 🚀 Kurulum ve Başlatma

Proje, tek bir kök dizin altında backend ve frontend dosyalarını barındıran bir monorepo yapısındadır.

### Ön Gereksinimler

*   **Node.js** (LTS versiyonu)
*   **Python** (3.9+)
*   **PostgreSQL** veritabanı sunucusu
*   `git`

### 1. Projeyi Klonlayın ve Kuruluma Başlayın

```bash
git clone <proje_repository_url>
cd <proje_dizini>
```

### 2. Backend Kurulumu (Ana Proje Dizini)

1.  **Python Sanal Ortamı Oluşturun ve Aktive Edin:**
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS / Linux
    source venv/bin/activate
    ```

2.  **Python Bağımlılıklarını Yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Veritabanını Ayarlayın:**
    *   PostgreSQL'de `music_assistant_db` adında yeni bir veritabanı oluşturun.

4.  **Ortam Değişkenlerini Ayarlayın (`.env`):
    Projenin ana dizininde `.env` adında bir dosya oluşturun ve aşağıdaki bilgileri doldurun:

    ```env
    # Spotify API Ayarları
    SPOTIFY_CLIENT_ID="YOUR_SPOTIFY_CLIENT_ID"
    SPOTIFY_CLIENT_SECRET="YOUR_SPOTIFY_CLIENT_SECRET"
    # ÖNEMLİ: Redirect URI, backend sunucunuzdaki callback endpoint'i olmalıdır.
    SPOTIFY_REDIRECT_URI="http://127.0.0.1:8000/callback"

    # Diğer Servisler
    LASTFM_API_KEY="YOUR_LASTFM_API_KEY"
    YOUTUBE_API_KEY="YOUR_YOUTUBE_API_KEY"
    HUGGING_FACE_API_TOKEN="YOUR_HUGGING_FACE_API_TOKEN"

    # Veritabanı ve Oturum Ayarları
    DATABASE_URL="postgresql://kullanici:sifre@localhost/music_assistant_db"
    # ÖNEMLİ: Güvenli oturum çerezleri için bu anahtarı oluşturun.
    SESSION_SECRET_KEY="RASTGELE_VE_COK_GIZLI_BIR_ANAHTAR_OLUSTURUN"
    ```

### 3. Frontend Kurulumu

1.  **Frontend Dizinine Girin:**
    ```bash
    cd client
    ```

2.  **Node.js Bağımlılıklarını Yükleyin:**
    ```bash
    npm install
    ```

3.  **Ana Dizine Geri Dönün:**
    ```bash
    cd ..
    ```

### 4. Uygulamayı Başlatın

Uygulamayı çalıştırmak için iki terminal açmanız gerekmektedir.

*   **Terminal 1: Backend Sunucusunu Başlatın (Ana Dizin):**
    ```bash
    uvicorn main:app --reload --port 8000
    ```

*   **Terminal 2: Frontend Sunucusunu Başlatın (Ana Dizin):**
    ```bash
    cd client
    npm run dev
    ```

Backend `http://127.0.0.1:8000` ve Frontend `http://localhost:3000` adresinde çalışmaya başlayacaktır. Tarayıcınızda `http://localhost:3000` adresini açın.

## 📂 Proje Yapısı

```
music-assistant1 - Kopya/
├── .venv/
├── client/             # Frontend (React) uygulaması
│   ├── src/
│   └── package.json
├── services/           # Backend servisleri (spotify_service.py)
├── .env                # (Oluşturulacak) Ortam değişkenleri
├── main.py             # FastAPI uygulama giriş noktası
├── models.py           # SQLAlchemy veritabanı modelleri
├── schemas.py          # Pydantic şemaları
├── database.py         # Veritabanı bağlantısı
└── requirements.txt    # Python bağımlılıkları
```

## 🛣️ Gelecek Planları

*   Daha akıcı ve stateful bir sohbet deneyimi.
*   Kullanıcıların çalma listelerini uygulama içinden tam olarak yönetebilmesi.
*   Kapsamlı birim ve entegrasyon testleri.
