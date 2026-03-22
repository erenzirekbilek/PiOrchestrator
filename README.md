# 🍓 Pi Scheduler

Pi Orchestrator, birden fazla Raspberry Pi (veya uyumlu edge cihazının) merkezî bir web arayüzü üzerinden yönetilmesini, izlenmesini ve otomatikleştirilmesini sağlayan bir orkestrasyon platformudur. Sistem, Dashboard, Sequences ve Device olmak üzere üç ana modül üzerine kurulmuştur.

Dashboard sayfasında, bağlı cihazların anlık sistem metrikleri (CPU kullanımı, bellek, sıcaklık, disk doluluk oranı) ve bağlantı durumu (Online/Offline) tek bir ekranda gösterilir. Cihazlar, MQTT protokolü üzerinden haberleşir: komutlar piorchestrator/device/commands konusuna JSON formatında gönderilir, yanıtlar ise piorchestrator/device/feedback üzerinden alınır. Bu sayede cihazların bulunduğu ağ topolojisinden bağımsız, güvenli ve ölçeklenebilir bir kontrol sağlanır.

Device modülü, cihaza ait genel bilgilerin (host adı, işletim sistemi) yanı sıra GPIO pin yönetimini sunar. Kullanıcı, BCM numaralarına göre pin ekleyebilir, aktif veya rezerve olarak işaretleyebilir. Bu sayede fiziksel bağlantılar (LED, sensör, röle vb.) uzaktan tanımlanır ve durumları izlenebilir.

Sequences bölümü ise, belirli koşullar veya zamanlamalarla tetiklenebilecek otomasyon akışlarının oluşturulmasına olanak tanır. Her sequence’in son çalışma zamanı, tetiklenme sayısı ve çalıştırma/yönetim aksiyonları (başlat, durdur, sıfırla) görsel olarak takip edilebilir. Aktif veya çalışan sequence’ler filtreleme ile ayrıştırılabilir.

Tüm bu özellikleriyle Pi Orchestrator, geliştiricilere ve sistem yöneticilerine hem ev laboratuvarı ölçeğinde hem de endüstriyel edge dağıtımlarında cihaz filolarını merkezî, otomatik ve hataya dayanıklı bir şekilde yönetme imkânı sunar.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.0.6-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)
![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-Compatible-A22846?style=flat&logo=raspberry-pi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## Nedir?

Pi Scheduler; röle, selenoid vana, LED sürücü veya herhangi bir GPIO cihazını tarayıcıdan zamanlayıp kontrol etmeni sağlar. Sulama sistemleri, ışık gösterileri veya endüstriyel otomasyon gibi senaryolar için tasarlanmıştır.

Tüm bileşenler Raspberry Pi üzerinde çalışır — harici bir sunucuya ihtiyaç yoktur.

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