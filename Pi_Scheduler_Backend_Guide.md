# Pi Scheduler — Backend Implementation Spec (Django)

> **Bu dosya bir AI coding agent için yazılmıştır.**
> Her bölümü sırayla uygula. Bir adım tamamlanmadan bir sonrakine geçme.
> Tüm dosyaları `backend/` klasörü altında oluştur.

---

## Stack & Versiyon Sabitleri

```
Python                        3.11+
django                        5.0.6
djangorestframework           3.15.1
djangorestframework-simplejwt 5.3.1
django-cors-headers           4.3.1
apscheduler                   3.10.4
psutil                        5.9.8
RPi.GPIO                      0.7.1   (sadece Pi'de kurulur)
```

`requirements.txt` bu versiyonları pin'le (`==`).

---

## Klasör Yapısı

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── pischeduler/                  ← Django projesi
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── auth_app/                 ← Kimlik doğrulama
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── pins/                     ← GPIO pin yönetimi
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── sequences/                ← Sekans yönetimi
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── triggers/                 ← Zamanlayıcı tetikleyiciler
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   └── device/                   ← Cihaz bilgisi
│       ├── __init__.py
│       ├── apps.py
│       ├── urls.py
│       └── views.py
├── services/
│   ├── __init__.py
│   ├── gpio_service.py
│   ├── sequence_runner.py
│   └── scheduler_service.py
└── seed.py
```

---

## ADIM 1 — pischeduler/settings.py

Django ayarlarını `.env` dosyasından `os.environ.get()` ile oku.

**Temel Ayarlar:**

```python
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY")  # zorunlu

DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / os.environ.get("DB_NAME", "pischeduler.db"),
    }
}

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "apps.auth_app",
    "apps.pins",
    "apps.sequences",
    "apps.triggers",
    "apps.device",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ... diğer Django middleware'leri
]
```

**DRF & JWT Ayarları:**

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "EXCEPTION_HANDLER": "pischeduler.exception_handler.custom_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    ),
    "ALGORITHM": os.environ.get("ALGORITHM", "HS256"),
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

**CORS Ayarları:**

```python
import json

CORS_ALLOWED_ORIGINS = json.loads(
    os.environ.get("CORS_ORIGINS", '["http://localhost:3000","http://localhost:5173"]')
)
CORS_ALLOW_CREDENTIALS = True
```

**Uygulama Özel Ayarlar:**

```python
GPIO_MOCK = os.environ.get("GPIO_MOCK", "True").lower() == "true"
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")  # zorunlu
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
```

**Logging:**

```python
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "pischeduler.log",
            "maxBytes": 10_000_000,
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": LOG_LEVEL,
    },
}
```

**.env.example:**

```
SECRET_KEY=change-this-to-a-random-32-char-string
DEBUG=false
ALLOWED_HOSTS=*
DB_NAME=pischeduler.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
GPIO_MOCK=true
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

---

## ADIM 2 — Özel Exception Handler

`pischeduler/exception_handler.py` dosyası oluştur.

DRF'in varsayılan exception handler'ını genişlet; tüm yakalanmayan hataları standart `{"detail": "..."}` formatında döndür.

```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return Response(
            {"detail": "Internal server error"},
            status=500
        )

    return response
```

---

## ADIM 3 — Models

### apps/pins/models.py

```python
from django.db import models

class Pin(models.Model):
    name = models.CharField(max_length=100)
    gpio_number = models.IntegerField(unique=True)
    is_reserved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pins"
```

### apps/sequences/models.py

**İki model bu dosyada:**

```python
import json
from django.db import models

class Sequence(models.Model):
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=False)
    length_seconds = models.IntegerField()
    step_seconds = models.IntegerField(default=1)
    last_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sequences"


class SequenceChannel(models.Model):
    sequence = models.ForeignKey(
        Sequence,
        on_delete=models.CASCADE,
        related_name="channels"
    )
    pin = models.ForeignKey(
        "pins.Pin",
        on_delete=models.PROTECT,
        related_name="channels"
    )
    signal_data = models.TextField()  # JSON string: "[0, 50, 100]"

    class Meta:
        db_table = "sequence_channels"
        unique_together = [("sequence", "pin")]
```

### apps/triggers/models.py

```python
from django.db import models

class Trigger(models.Model):
    sequence = models.ForeignKey(
        "sequences.Sequence",
        on_delete=models.CASCADE,
        related_name="triggers"
    )
    cron_expression = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "triggers"
```

**Not:** Django'nun yerleşik `User` modeli (`django.contrib.auth`) kullanılır. Özel `User` modeli oluşturmaya gerek yoktur.

---

## ADIM 4 — Migrations

```bash
cd backend
python manage.py makemigrations pins sequences triggers
python manage.py migrate
```

---

## ADIM 5 — Serializers

### apps/auth_app/serializers.py

```python
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError("Incorrect username or password.")
        if not user.is_active:
            raise serializers.ValidationError("User is inactive.")
        data["user"] = user
        return data


class TokenResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    token_type = serializers.CharField(default="bearer")


class UserResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    is_active = serializers.BooleanField()
    date_joined = serializers.DateTimeField()  # Django User'daki alan adı
```

### apps/pins/serializers.py

```python
from rest_framework import serializers
from .models import Pin

class PinSerializer(serializers.ModelSerializer):
    # is_active alanı, GPIO live değeriyle runtime'da override edilir
    class Meta:
        model = Pin
        fields = ["id", "name", "gpio_number", "is_reserved", "is_active"]
        read_only_fields = ["id"]
```

### apps/sequences/serializers.py

```python
import json
from rest_framework import serializers
from .models import Sequence, SequenceChannel
from apps.pins.models import Pin


class ChannelCreateSerializer(serializers.Serializer):
    pin_id = serializers.IntegerField()
    signal_data = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=100)
    )


class ChannelResponseSerializer(serializers.ModelSerializer):
    pin_name = serializers.CharField(source="pin.name", read_only=True)
    gpio_number = serializers.IntegerField(source="pin.gpio_number", read_only=True)
    signal_data = serializers.SerializerMethodField()

    def get_signal_data(self, obj):
        return json.loads(obj.signal_data)

    class Meta:
        model = SequenceChannel
        fields = ["id", "pin_id", "pin_name", "gpio_number", "signal_data"]


class SequenceCreateSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=200)
    is_active = serializers.BooleanField(default=False)
    length_seconds = serializers.IntegerField(min_value=1)
    step_seconds = serializers.IntegerField(min_value=1, default=1)
    channels = ChannelCreateSerializer(many=True, default=[])


class SequenceUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=200, required=False)
    is_active = serializers.BooleanField(required=False)
    length_seconds = serializers.IntegerField(min_value=1, required=False)
    step_seconds = serializers.IntegerField(min_value=1, required=False)


class SequenceResponseSerializer(serializers.ModelSerializer):
    channels = ChannelResponseSerializer(many=True, read_only=True)
    trigger_count = serializers.SerializerMethodField()
    channel_count = serializers.SerializerMethodField()

    def get_trigger_count(self, obj):
        return obj.triggers.count()

    def get_channel_count(self, obj):
        return obj.channels.count()

    class Meta:
        model = Sequence
        fields = [
            "id", "name", "is_active", "length_seconds", "step_seconds",
            "last_run", "created_at", "trigger_count", "channel_count", "channels"
        ]


class SequenceListSerializer(serializers.ModelSerializer):
    """Channels dahil etmez — liste endpoint'i için."""
    trigger_count = serializers.SerializerMethodField()

    def get_trigger_count(self, obj):
        return obj.triggers.count()

    class Meta:
        model = Sequence
        fields = [
            "id", "name", "is_active", "length_seconds", "step_seconds",
            "last_run", "created_at", "trigger_count"
        ]
```

### apps/triggers/serializers.py

```python
from apscheduler.triggers.cron import CronTrigger as APSCronTrigger
from rest_framework import serializers
from .models import Trigger


def validate_cron(value):
    try:
        APSCronTrigger.from_crontab(value)
    except Exception:
        raise serializers.ValidationError("Invalid cron expression.")
    return value


class TriggerCreateSerializer(serializers.Serializer):
    cron_expression = serializers.CharField(validators=[validate_cron])
    is_active = serializers.BooleanField(default=True)


class TriggerUpdateSerializer(serializers.Serializer):
    cron_expression = serializers.CharField(
        validators=[validate_cron], required=False
    )
    is_active = serializers.BooleanField(required=False)


class TriggerResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trigger
        fields = [
            "id", "sequence_id", "cron_expression",
            "is_active", "last_run", "created_at"
        ]
```

---

## ADIM 6 — services/gpio_service.py

### Sınıf: `GPIOService`

**Constructor:**
- `django.conf.settings.GPIO_MOCK` değerini oku
- Mock değilse `RPi.GPIO as GPIO` runtime import et (ModuleNotFoundError'ı handle et)
- Mock modda `_mock_states: dict[int, bool] = {}` tut
- `_pwm_instances: dict[int, Any] = {}` tut
- Logger başlat

**`setup_pin(gpio_number: int) -> None`**
- Mock: `_mock_states[gpio_number] = False`
- Gerçek: `GPIO.setup(gpio_number, GPIO.OUT, initial=GPIO.LOW)`

**`read_pin(gpio_number: int) -> bool`**
- Mock: `_mock_states.get(gpio_number, False)`
- Gerçek: `bool(GPIO.input(gpio_number))`

**`set_digital(gpio_number: int, state: bool) -> None`**
- Varsa PWM'i durdur
- Mock: `_mock_states[gpio_number] = state`
- Gerçek: `GPIO.output(gpio_number, GPIO.HIGH if state else GPIO.LOW)`

**`set_pwm(gpio_number: int, duty_cycle: float) -> None`**
- `duty_cycle` 0.0–100.0 arası, dışarıdaysa clamp et
- Mock: `_mock_states[gpio_number] = duty_cycle > 0`
- Gerçek: Varsa mevcut PWM'i güncelle (`ChangeDutyCycle`), yoksa yeni oluştur (100Hz)

**`set_pin_value(gpio_number: int, value: int) -> None`**
- `value == 0` → `set_digital(False)`
- `value == 100` → `set_digital(True)`
- Diğer → `set_pwm(float(value))`

**`all_pins_off() -> None`**
- Tüm `_pwm_instances`'ı durdur, temizle
- Tüm bilinen pinleri LOW yap

**`initialize(pins: list) -> None`**
- Her pin için `setup_pin` çağır
- `all_pins_off()` çağır
- Mock değilse `GPIO.setmode(GPIO.BCM)` çağır

**`cleanup() -> None`**
- `all_pins_off()`
- Mock değilse `GPIO.cleanup()`

**Singleton export:**
```python
gpio_service = GPIOService()
```

---

## ADIM 7 — services/sequence_runner.py

### Sınıf: `SequenceRunner`

**State:**
```python
_running: dict[int, threading.Event]
_threads: dict[int, threading.Thread]
_lock: threading.Lock
```

**`is_running(sequence_id: int) -> bool`**

**`get_running_ids() -> list[int]`**

**`run(sequence_id: int) -> dict`**

Çalışma mantığı:
1. Lock al; zaten çalışıyorsa `{"status": "already_running"}` döndür
2. Stop event oluştur
3. Daemon thread başlat: `target=_execute, args=(sequence_id, stop_event)`
4. `_running` ve `_threads`'e ekle
5. `{"status": "started", "sequence_id": sequence_id}` döndür

**`_execute(sequence_id: int, stop_event: threading.Event) -> None`**

```
1. django.db.connection.close() ile thread'e yeni connection aç
2. Sequence'i channels ve pin'leriyle yükle:
   Sequence.objects.prefetch_related("channels__pin").get(id=sequence_id)
3. total_steps = length_seconds // step_seconds
4. Her step:
   a. stop_event.is_set() → break
   b. Her channel:
      - signal_data = json.loads(channel.signal_data)
      - value = signal_data[step_index % len(signal_data)]
      - gpio_service.set_pin_value(channel.pin.gpio_number, value)
   c. stop_event.wait(timeout=step_seconds) → True → break
5. gpio_service.all_pins_off()
6. Sequence.objects.filter(id=sequence_id).update(last_run=now())
7. _running ve _threads'den temizle (lock ile)
8. Exception → log ERROR, all_pins_off(), state temizle
9. finally: django.db.connection.close()
```

> **Önemli:** Django ORM'i thread'ler arası paylaşılan DB bağlantısını desteklemez.
> Her thread başında `django.db.connection.close()` çağırarak thread'in kendi
> bağlantısını oluşturması sağlanır. `finally` bloğunda tekrar kapatılır.

**`stop(sequence_id: int) -> dict`**
1. `_running[sequence_id]` stop_event'ini set et
2. `_threads[sequence_id].join(timeout=10)` bekle
3. Bitmezse log WARNING
4. `{"status": "stopped", "sequence_id": sequence_id}` döndür

**`stop_all() -> None`**
Tüm çalışan sekanslar için `stop()` çağır.

**Singleton export:**
```python
sequence_runner = SequenceRunner()
```

---

## ADIM 8 — services/scheduler_service.py

### Sınıf: `SchedulerService`

**Constructor:**
- `BackgroundScheduler` oluştur
- Job store: `SQLAlchemyJobStore(url="sqlite:///pischeduler.db")` (settings'den al)
- Executor: `ThreadPoolExecutor(max_workers=10)`
- `job_defaults={"coalesce": True, "max_instances": 1}`
- Timezone: `"UTC"`

**`start() -> None`**
- `scheduler.start()`
- `_load_triggers_from_db()` çağır

**`_load_triggers_from_db() -> None`**
- `Trigger.objects.filter(is_active=True)` ile yükle
- Her biri için `_add_job(trigger)` çağır

**`_add_job(trigger) -> None`**
- Job ID: `f"trigger_{trigger.id}"`
- Function: `_run_sequence_job`
- Args: `[trigger.sequence_id]`
- `CronTrigger.from_crontab(trigger.cron_expression)`
- `replace_existing=True`

**`_run_sequence_job(sequence_id: int) -> None`** (standalone fonksiyon)
- Django ORM thread-safe erişim için `django.db.connection.close()` çağır
- `sequence_runner.run(sequence_id)` çağır
- `Trigger.objects.filter(sequence_id=sequence_id).update(last_run=now())`

**`add_trigger(trigger) -> None`** / **`remove_trigger(trigger_id: int) -> None`** / **`update_trigger(trigger) -> None`**
Orijinal spec ile aynı mantık.

**`shutdown() -> None`**
- `scheduler.shutdown(wait=False)`

**Singleton export:**
```python
scheduler_service = SchedulerService()
```

---

## ADIM 9 — App Config (AppReady Signal ile Scheduler Başlatma)

APScheduler'ı Django'nun `AppConfig.ready()` metodunda başlat. Bu, `manage.py` komutlarında (migrate, seed vb.) çift başlatmayı önler.

```python
# apps/sequences/apps.py (ya da herhangi bir merkezi app)

from django.apps import AppConfig

class SequencesConfig(AppConfig):
    name = "apps.sequences"

    def ready(self):
        import os
        # manage.py runserver --reload durumunda çift başlatmayı önle
        if os.environ.get("RUN_MAIN") != "true" and not os.environ.get("DJANGO_SKIP_SCHEDULER"):
            return

        from services.scheduler_service import scheduler_service
        from services.gpio_service import gpio_service
        from apps.pins.models import Pin

        pins = Pin.objects.all()
        gpio_service.initialize(list(pins))
        scheduler_service.start()
```

> **Not:** Production'da (gunicorn, uvicorn) `RUN_MAIN` kontrolü gereksizdir; sadece
> `manage.py runserver`'ın watchdog süreci için gereklidir. Environment'a göre düzenle.

**Shutdown için Django signal:**

```python
# pischeduler/apps.py ya da herhangi bir signal dosyası

from django.db import close_old_connections
import atexit

def shutdown_services():
    from services.scheduler_service import scheduler_service
    from services.sequence_runner import sequence_runner
    from services.gpio_service import gpio_service
    sequence_runner.stop_all()
    scheduler_service.shutdown()
    gpio_service.cleanup()

atexit.register(shutdown_services)
```

---

## ADIM 10 — Views: auth_app

**Prefix:** `/auth/`

```python
# apps/auth_app/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserLoginSerializer, TokenResponseSerializer, UserResponseSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response({
            "access_token": str(refresh.access_token),
            "token_type": "bearer"
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserResponseSerializer(request.user).data)
```

```python
# apps/auth_app/urls.py
from django.urls import path
from .views import LoginView, MeView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("me/", MeView.as_view()),
]
```

---

## ADIM 11 — Views: pins

**Prefix:** `/pins/`

### GET /pins/
Tüm pinleri getir. Her pin için `gpio_service.read_pin()` ile `is_active`'i canlı güncelle (DB'ye yazma).

### GET /pins/reserved/
`is_reserved=True` filtrele.

### GET /pins/{pin_id}/
404 if not found.

### POST /pins/{pin_id}/toggle/
- Pin bul (404)
- `gpio_service.read_pin()` ile mevcut durumu oku
- `gpio_service.set_digital(gpio_number, not current)` çağır
- `Pin.objects.filter(id=pin_id).update(is_active=not current)`
- Güncel `PinSerializer` ile döndür

```python
# apps/pins/views.py

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Pin
from .serializers import PinSerializer
from services.gpio_service import gpio_service

logger = logging.getLogger(__name__)


class PinListView(APIView):
    def get(self, request):
        pins = Pin.objects.all()
        data = []
        for pin in pins:
            live_state = gpio_service.read_pin(pin.gpio_number)
            serializer = PinSerializer(pin)
            pin_data = serializer.data
            pin_data["is_active"] = live_state
            data.append(pin_data)
        return Response(data)


class PinReservedView(APIView):
    def get(self, request):
        pins = Pin.objects.filter(is_reserved=True)
        return Response(PinSerializer(pins, many=True).data)


class PinDetailView(APIView):
    def get(self, request, pin_id):
        pin = get_object_or_404(Pin, id=pin_id)
        return Response(PinSerializer(pin).data)


class PinToggleView(APIView):
    def post(self, request, pin_id):
        pin = get_object_or_404(Pin, id=pin_id)
        current = gpio_service.read_pin(pin.gpio_number)
        new_state = not current
        gpio_service.set_digital(pin.gpio_number, new_state)
        Pin.objects.filter(id=pin_id).update(is_active=new_state)
        pin.refresh_from_db()
        return Response(PinSerializer(pin).data)
```

```python
# apps/pins/urls.py
from django.urls import path
from .views import PinListView, PinReservedView, PinDetailView, PinToggleView

urlpatterns = [
    path("", PinListView.as_view()),
    path("reserved/", PinReservedView.as_view()),
    path("<int:pin_id>/", PinDetailView.as_view()),
    path("<int:pin_id>/toggle/", PinToggleView.as_view()),
]
```

---

## ADIM 12 — Views: sequences

**Prefix:** `/sequences/`

### GET /sequences/
Query params: `status` (`"active"`, `"running"`)

### GET /sequences/{sequence_id}/
`prefetch_related("channels__pin", "triggers")` ile yükle.

### POST /sequences/
Validation (view içinde elle uygula):
1. `length_seconds % step_seconds != 0` → 400
2. `total_steps = length_seconds // step_seconds`
3. Her channel: `len(signal_data) != total_steps` → 400
4. Her channel: pin yoksa → 404
5. Pin reserved ise → 400
6. Duplicate pin_id → 400

Kaydetme: `Sequence.objects.create(...)` ardından her channel için `SequenceChannel.objects.create(...)` — `json.dumps(signal_data)` ile sakla. 201 döndür.

### PUT /sequences/{sequence_id}/
Sadece gönderilen (non-None) alanları güncelle. `filter(...).update(...)` ya da `save()` kullan.

### DELETE /sequences/{sequence_id}/
- `sequence_runner.stop(sequence_id)` (çalışıyorsa)
- Her trigger için `scheduler_service.remove_trigger(trigger.id)`
- `sequence.delete()`
- 204 döndür

### POST /sequences/{sequence_id}/run/
- Sekans yoksa 404
- `is_active=False` ise 400
- `sequence_runner.run(sequence_id)` çağır

### POST /sequences/{sequence_id}/stop/
- `sequence_runner.is_running()` False ise 400
- `sequence_runner.stop()` çağır

### POST /sequences/{sequence_id}/copy/
- Orijinali yükle (404)
- `name = f"{original.name} copy"`, `is_active=False`, `last_run=None`
- Tüm channelları kopyala (trigger'lar kopyalanmaz)
- 201 döndür

```python
# apps/sequences/urls.py
from django.urls import path
from .views import (
    SequenceListView, SequenceDetailView,
    SequenceRunView, SequenceStopView, SequenceCopyView
)

urlpatterns = [
    path("", SequenceListView.as_view()),
    path("<int:sequence_id>/", SequenceDetailView.as_view()),
    path("<int:sequence_id>/run/", SequenceRunView.as_view()),
    path("<int:sequence_id>/stop/", SequenceStopView.as_view()),
    path("<int:sequence_id>/copy/", SequenceCopyView.as_view()),
]
```

---

## ADIM 13 — Views: triggers

**Prefix:** `/sequences/{sequence_id}/triggers/`

### GET /sequences/{sequence_id}/triggers/
Sequence yoksa 404. Sequence'ın tüm triggerlerini listele.

### POST /sequences/{sequence_id}/triggers/
1. Sequence bul (404)
2. Cron validate (`validate_cron` helper)
3. `Trigger.objects.create(...)`
4. `is_active=True` ise `scheduler_service.add_trigger(trigger)`
5. 201

### PUT /triggers/{trigger_id}/  *(ayrı route)*
1. Trigger bul (404)
2. Cron geldiyse validate et
3. Güncelle
4. `scheduler_service.update_trigger(trigger)` çağır

### DELETE /triggers/{trigger_id}/  *(ayrı route)*
1. Trigger bul (404)
2. `scheduler_service.remove_trigger(trigger.id)`
3. `trigger.delete()`
4. 204

```python
# apps/triggers/urls.py
from django.urls import path
from .views import TriggerListView, TriggerDetailView

urlpatterns = [
    # sequence_id parametreli prefix pischeduler/urls.py'de gelir
    path("", TriggerListView.as_view()),
    path("<int:trigger_id>/", TriggerDetailView.as_view()),
]
```

---

## ADIM 14 — Views: device

**Prefix:** `/device/`

**Authentication:** Yok (`AllowAny`)

### GET /device/time/

```python
{
    "datetime": datetime.now().isoformat(),
    "timestamp": time.time(),
    "timezone": str(datetime.now().astimezone().tzinfo)
}
```

### GET /device/info/

`psutil` ile CPU, bellek, disk bilgileri. `_read_cpu_temp()` ile sıcaklık okuma (`/sys/class/thermal/thermal_zone0/temp`, dosya yoksa `None`).

```python
# apps/device/views.py

import time
import psutil
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


def _read_cpu_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            return int(f.read().strip()) / 1000
    except FileNotFoundError:
        return None


class DeviceTimeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "datetime": datetime.now().isoformat(),
            "timestamp": time.time(),
            "timezone": str(datetime.now().astimezone().tzinfo),
        })


class DeviceInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        return Response({
            "cpu_temperature": _read_cpu_temp(),
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory": {
                "total": mem.total,
                "available": mem.available,
                "percent": mem.percent,
            },
            "disk": {
                "total": disk.total,
                "free": disk.free,
                "percent": disk.percent,
            },
            "uptime_seconds": time.time() - psutil.boot_time(),
        })
```

---

## ADIM 15 — pischeduler/urls.py

```python
from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.auth_app.urls")),
    path("pins/", include("apps.pins.urls")),
    path("sequences/", include("apps.sequences.urls")),
    path(
        "sequences/<int:sequence_id>/triggers/",
        include("apps.triggers.urls")
    ),
    path("triggers/", include("apps.triggers.urls")),  # PUT/DELETE için kısa yol
    path("device/", include("apps.device.urls")),
    path("health/", HealthView.as_view()),
]
```

### GET /health/

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.timezone import now
from services.sequence_runner import sequence_runner
from django.conf import settings

class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "ok",
            "time": now().isoformat(),
            "gpio_mock": settings.GPIO_MOCK,
            "running_sequences": len(sequence_runner.get_running_ids()),
        })
```

---

## ADIM 16 — seed.py

Standalone script: `python seed.py`

**Başına Django setup ekle:**

```python
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pischeduler.settings")
django.setup()
```

**Yapılacaklar:**

1. `migrate` çağrısı gerekmez (migrations zaten uygulanmış olmalı)
2. Admin kullanıcısı oluştur:
   - `User.objects.filter(username=ADMIN_USERNAME).exists()` → varsa skip
   - `User.objects.create_superuser(username, password=ADMIN_PASSWORD)`
3. Varsayılan pinleri oluştur (`get_or_create` ile):

| name | gpio_number | is_reserved |
|---|---|---|
| Valve 1 | 7 | False |
| Valve 2 | 10 | False |
| Valve 3 | 11 | False |
| Valve 4 | 12 | False |
| Light 1 | 32 | False |
| Light 3 | 33 | False |
| Light 4 | 36 | False |
| System Clock | 4 | True |

4. Örnek sekans oluştur (DB boşsa):
   - Name: "Morning Irrigation", `length_seconds=60`, `step_seconds=1`, `is_active=False`
   - Channel: Valve 1, `signal_data=json.dumps([100] * 60)`

5. Her adımda `print()` ile status yaz.

---

## ADIM 17 — Uygulama Başlatma ve Doğrulama

### Başlatma Sırası

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # .env'yi düzenle
python manage.py migrate
python seed.py
python manage.py runserver 0.0.0.0:8000
```

### Production (Gunicorn)

```bash
pip install gunicorn
DJANGO_SKIP_SCHEDULER=  gunicorn pischeduler.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --threads 4
```

> **Önemli:** APScheduler tek bir process'te çalışmalıdır. `--workers 1` kullan.
> Çoklu worker gerekiyorsa job store'u Redis/DB tabanlı yap ve scheduler'ı
> ayrı bir process olarak çalıştır.

### Doğrulama Checklist

- [ ] `GET http://localhost:8000/health/` → `{"status": "ok", ...}`
- [ ] `POST http://localhost:8000/auth/login/` (JSON: username, password) → access_token
- [ ] `GET http://localhost:8000/pins/` (Authorization: Bearer TOKEN)
- [ ] `GET http://localhost:8000/device/time/` → saat bilgisi
- [ ] `POST http://localhost:8000/sequences/` → yeni sekans oluştur → 201
- [ ] `POST http://localhost:8000/sequences/{id}/run/` → `"started"` dönmeli
- [ ] `GET http://localhost:8000/sequences/?status=running` → çalışan sekans
- [ ] `POST http://localhost:8000/sequences/{id}/stop/` → sekans durmalı

---

## FastAPI → Django Farkları (Özet)

| Konu | FastAPI (orijinal) | Django |
|---|---|---|
| Auth | `python-jose` + `passlib` | `djangorestframework-simplejwt` |
| ORM | SQLAlchemy 2.0 | Django ORM |
| Migrations | Alembic | `manage.py makemigrations / migrate` |
| Dependency Injection | `Depends()` | DRF `permission_classes` + `get_object_or_404` |
| Settings | `pydantic-settings` | `django.conf.settings` + `os.environ` |
| Startup/Shutdown | `@app.on_event` | `AppConfig.ready()` + `atexit` |
| Schemas/Validation | Pydantic v2 | DRF Serializers |
| Login endpoint | form data (`OAuth2PasswordRequestForm`) | JSON body |
| Thread-safe ORM | `db_session_factory` callback | `connection.close()` per thread |
| Swagger/OpenAPI | `/docs` (otomatik) | `drf-spectacular` eklenirse `/api/schema/swagger-ui/` |

---

## Hata Yönetimi Kuralları

| Durum | HTTP Kodu |
|---|---|
| Başarılı GET | 200 |
| Başarılı POST (kayıt oluştu) | 201 |
| Başarılı DELETE | 204 |
| Geçersiz veri / iş kuralı ihlali | 400 |
| Token yok / geçersiz | 401 |
| Kayıt bulunamadı | 404 |
| Çakışma | 409 |
| Sunucu hatası | 500 |

Response body formatı (hatalar için):
```json
{"detail": "Human-readable error message"}
```

DRF bu formatı zaten standart olarak kullanır. Custom exception handler sayesinde yakalanmayan hatalar da bu formata dönüştürülür.

---

## Güvenlik Notları

- Django'nun `User` modeli `password` alanını hiçbir serializer'da döndürme
- `SECRET_KEY` minimum 32 karakter olmalı
- Login endpoint'inde kullanıcı adı ve şifre hatalarını aynı mesajla döndür
- Tüm write operasyonları (POST, PUT, DELETE) `IsAuthenticated` ile korumalı olmalı
- `/health/`, `/device/time/`, `/device/info/` → `AllowAny`
- DRF Browsable API'yi production'da kapat: `DEFAULT_RENDERER_CLASSES = ["rest_framework.renderers.JSONRenderer"]`