# 🍓 Pi Scheduler

Evdeki sulama sistemini sabah 7'de otomatik devreye sokmak, ışıkları belirli saatlerde açıp kapatmak ya da herhangi bir GPIO cihazını uzaktan kontrol etmek istiyorsan Pi Scheduler bunun için. Raspberry Pi'ye bağlı röle, vana, LED veya pompa gibi cihazları tarayıcıdan yönetiyorsun — zamanlayıcı kur, sekans oluştur, pini manuel aç kapat. Harici bir sunucuya gerek yok, her şey Pi'nin üzerinde çalışıyor.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.0.6-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)
![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-Compatible-A22846?style=flat&logo=raspberry-pi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## Nedir?

Pi Orchestrator, birden fazla Raspberry Pi (veya uyumlu edge cihazının) merkezî bir web arayüzü üzerinden yönetilmesini, izlenmesini ve otomatikleştirilmesini sağlayan bir orkestrasyon platformudur. Sistem, Dashboard, Sequences ve Device olmak üzere üç ana modül üzerine kurulmuştur.

Dashboard sayfasında, bağlı cihazların anlık sistem metrikleri (CPU kullanımı, bellek, sıcaklık, disk doluluk oranı) ve bağlantı durumu (Online/Offline) tek bir ekranda gösterilir. Cihazlar, MQTT protokolü üzerinden haberleşir: komutlar piorchestrator/device/commands konusuna JSON formatında gönderilir, yanıtlar ise piorchestrator/device/feedback üzerinden alınır. Bu sayede cihazların bulunduğu ağ topolojisinden bağımsız, güvenli ve ölçeklenebilir bir kontrol sağlanır.

Device modülü, cihaza ait genel bilgilerin (host adı, işletim sistemi) yanı sıra GPIO pin yönetimini sunar. Kullanıcı, BCM numaralarına göre pin ekleyebilir, aktif veya rezerve olarak işaretleyebilir. Bu sayede fiziksel bağlantılar (LED, sensör, röle vb.) uzaktan tanımlanır ve durumları izlenebilir.

Sequences bölümü ise, belirli koşullar veya zamanlamalarla tetiklenebilecek otomasyon akışlarının oluşturulmasına olanak tanır. Her sequence’in son çalışma zamanı, tetiklenme sayısı ve çalıştırma/yönetim aksiyonları (başlat, durdur, sıfırla) görsel olarak takip edilebilir. Aktif veya çalışan sequence’ler filtreleme ile ayrıştırılabilir.

Tüm bu özellikleriyle Pi Orchestrator, geliştiricilere ve sistem yöneticilerine hem ev laboratuvarı ölçeğinde hem de endüstriyel edge dağıtımlarında cihaz filolarını merkezî, otomatik ve hataya dayanıklı bir şekilde yönetme imkânı sunar.

Bu açıklama, projenin işlevsel bileşenlerini ve hedef kitlesine sağladığı faydayı net şekilde ortaya koymaktadır. İsterseniz daha teknik (kullanılan teknolojiler, mimari) veya daha kısa bir versiyonunu da hazırlayabilirim.

---

## Özellikler

- **Canlı Dashboard** — Cihaz saati, pin durumları ve aktif sekanslar tek ekranda
- **Sekans Motoru** — Çok kanallı, adım tabanlı GPIO sekansları oluştur ve çalıştır
- **Zamanlayıcı** — Cron ifadeleriyle birden fazla tetikleyici tanımla
- **PWM Desteği** — 0–100 arası sinyal değerleriyle kademeli kontrol
- **Anlık Kontrol** — Herhangi bir pini web arayüzünden manuel aç/kapat
- **Karanlık Mod** — Açık/karanlık tema geçişi
- **Mock Mod** — Raspberry Pi olmadan geliştirme yapabilme
- **REST API** — JWT kimlik doğrulamalı tam dokümanlı API

---

## Ekran Görüntüleri

| Dashboard | Sequences | Add Sequence |
|-----------|-----------|--------------|
| Pin durumları ve aktif sekanslar | Tüm sekansların listesi ve tetikleyici sayıları | Çok kanallı sekans oluşturma modalı |

### 🎬 Demo Video

[![Pi Scheduler Demo](https://img.youtube.com/vi/cS7qtQBqYnE/maxresdefault.jpg)](https://www.youtube.com/watch?v=cS7qtQBqYnE)

> Uygulamanın nasıl çalıştığını görmek için videoyu izleyin.

---

## Teknoloji Yığını

### Backend
| Paket | Versiyon | Görev |
|---|---|---|
| Django | 5.0.6 | Web framework |
| Django REST Framework | 3.15.1 | REST API |
| djangorestframework-simplejwt | 5.3.1 | JWT kimlik doğrulama |
| APScheduler | 3.10.4 | Cron zamanlayıcı |
| RPi.GPIO | 0.7.1 | GPIO kontrolü |
| psutil | 5.9.8 | Sistem bilgisi |

### Frontend
| Paket | Versiyon | Görev |
|---|---|---|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool |
| Tailwind CSS | 3+ | Stil |
| React Router DOM | 6+ | Sayfa yönlendirme |
| Axios | 1+ | HTTP istekleri |
| Lucide React | latest | İkonlar |

---

## Kurulum

### Gereksinimler

- Raspberry Pi 3B / 4B / Zero 2W (veya herhangi bir Linux makinesi mock modda)
- Python 3.11+
- Node.js 18+
- GPIO'ya bağlı röle modülü, vana veya LED sürücü

### 1. Depoyu Klonla
```bash
git clone https://github.com/kullanici/pi-scheduler.git
cd pi-scheduler
```

### 2. Backend Kurulumu
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`.env` dosyasını oluştur:
```bash
cp .env.example .env
```

`.env` içini düzenle:
```env
SECRET_KEY=en-az-32-karakterli-rastgele-string
DEBUG=false
ADMIN_USERNAME=admin
ADMIN_PASSWORD=guclu-bir-sifre
GPIO_MOCK=true          # Pi'de false yap
```

Veritabanını hazırla ve başlangıç verilerini yükle:
```bash
python manage.py migrate
python seed.py
```

Backend'i başlat:
```bash
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev             # Geliştirme: http://localhost:5173
```

Üretim build:
```bash
npm run build           # dist/ klasörü oluşur
```

### 4. Pi'de Otomatik Başlatma

`/etc/systemd/system/pi-scheduler.service` dosyasını oluştur:
```ini
[Unit]
Description=Pi Scheduler Backend
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/pi-scheduler/backend
ExecStart=/home/pi/pi-scheduler/backend/venv/bin/gunicorn pischeduler.wsgi:application --bind 0.0.0.0:8000 --workers 1 --threads 4
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable pi-scheduler
sudo systemctl start pi-scheduler
```

### 5. Nginx ile Serve

`/etc/nginx/sites-available/pi-scheduler`:
```nginx
server {
    listen 80;
    server_name _;

    root /var/www/pi-scheduler;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
```bash
sudo cp -r frontend/dist/* /var/www/pi-scheduler/
sudo ln -s /etc/nginx/sites-available/pi-scheduler /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Artık aynı ağdaki herhangi bir cihazdan `http://<pi-ip-adresi>` ile erişebilirsin.

---

## Bağlantı Mimarisi
```
Tarayıcı (telefon/bilgisayar)
        │
        │  HTTP — aynı Wi-Fi ağı
        ▼
┌─────────────────────────────────────────┐
│           Raspberry Pi                  │
│                                         │
│  Nginx (port 80)                        │
│    ├── /* → React build (static)        │
│    └── /api/ → Django (port 8000)       │
│                                         │
│  Django + DRF                           │
│    ├── APScheduler (cron tetikleyiciler)│
│    └── GPIO Service (RPi.GPIO)          │
│                  │                      │
└──────────────────┼──────────────────────┘
                   │ GPIO pinler
            ┌──────┴──────┐
            │  Röle / Vana│
            │  LED / Pompa│
            └─────────────┘
```

---

## API Referansı

Uygulama çalışırken tam API dokümantasyonuna erişmek için `drf-spectacular` entegrasyonunu etkinleştir.

### Temel Endpoint'ler

| Metot | Endpoint | Açıklama | Auth |
|---|---|---|---|
| GET | `/health/` | Sistem durumu | Hayır |
| POST | `/auth/login/` | JWT token al | Hayır |
| GET | `/pins/` | Tüm pinler | Evet |
| POST | `/pins/{id}/toggle/` | Pin aç/kapat | Evet |
| GET | `/sequences/` | Tüm sekanslar | Evet |
| POST | `/sequences/` | Yeni sekans | Evet |
| POST | `/sequences/{id}/run/` | Sekansı başlat | Evet |
| POST | `/sequences/{id}/stop/` | Sekansı durdur | Evet |
| POST | `/sequences/{id}/copy/` | Sekansı kopyala | Evet |
| GET | `/sequences/{id}/triggers/` | Tetikleyiciler | Evet |
| POST | `/sequences/{id}/triggers/` | Tetikleyici ekle | Evet |
| GET | `/device/time/` | Cihaz saati | Hayır |
| GET | `/device/info/` | Sistem bilgisi | Hayır |

### Örnek İstek
```bash
# Giriş yap
curl -X POST http://localhost:8000/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sifre"}'

# Pinleri listele
curl http://localhost:8000/pins/ \
  -H "Authorization: Bearer <token>"

# Sekans oluştur
curl -X POST http://localhost:8000/sequences/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sabah Sulaması",
    "is_active": true,
    "length_seconds": 60,
    "step_seconds": 1,
    "channels": [
      {"pin_id": 1, "signal_data": [100, 100, 100, 0, 0, 0]}
    ]
  }'
```

---

## Proje Yapısı
```
pi-scheduler/
├── backend/
│   ├── pischeduler/          # Django proje ayarları
│   ├── apps/
│   │   ├── auth_app/         # JWT kimlik doğrulama
│   │   ├── pins/             # GPIO pin yönetimi
│   │   ├── sequences/        # Sekans CRUD
│   │   ├── triggers/         # Cron tetikleyiciler
│   │   └── device/           # Sistem bilgisi
│   ├── services/
│   │   ├── gpio_service.py   # RPi.GPIO soyutlama katmanı
│   │   ├── sequence_runner.py# Thread tabanlı sekans motoru
│   │   └── scheduler_service.py # APScheduler entegrasyonu
│   ├── seed.py               # Başlangıç verileri
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios HTTP client
│   │   ├── components/       # UI bileşenleri
│   │   ├── hooks/            # Veri yönetimi hooks
│   │   └── pages/            # Dashboard, Sequences, Device
│   └── package.json
└── README.md
```

---

## Geliştirme

### Mock Modda Çalıştırma

Raspberry Pi olmadan geliştirme yapabilirsin. `.env` dosyasında `GPIO_MOCK=true` olduğunda GPIO çağrıları simüle edilir, fiziksel donanım gerekmez.

### Yeni Pin Ekleme

`seed.py` dosyasındaki pin listesini düzenle veya API üzerinden ekle. GPIO BCM numaralandırma sistemini kullan.

### Katkıda Bulunma

1. Fork'la
2. Feature branch aç: `git checkout -b feature/yeni-ozellik`
3. Commit'le: `git commit -m 'feat: yeni özellik eklendi'`
4. Push'la: `git push origin feature/yeni-ozellik`
5. Pull Request aç

---

## Güvenlik

- `.env` dosyasını asla repoya commit'leme
- `SECRET_KEY` minimum 32 karakter olmalı
- Prodüksiyonda `DEBUG=false` kullan
- Pi'yi internete açmak için VPN veya SSH tüneli kullan

---

## Lisans

MIT License — Dilediğiniz gibi kullanabilirsiniz.

---

## Teşekkürler

- [RPi.GPIO](https://pypi.org/project/RPi.GPIO/) — GPIO kontrolü
- [APScheduler](https://apscheduler.readthedocs.io/) — Zamanlayıcı motoru
- [Django REST Framework](https://www.django-rest-framework.org/) — API altyapısı