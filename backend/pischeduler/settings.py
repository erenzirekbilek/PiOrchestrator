import os
import json
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-fallback-key-123")

DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

# Uygulama listesini tam hale getirdik
INSTALLED_APPS = [
    "django.contrib.admin",          # Eksikti, eklendi
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",       # Eksikti, eklendi
    "django.contrib.messages",       # Eksikti, eklendi
    "django.contrib.staticfiles",    # Eksikti, eklendi
    
    # Third party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    
    # Local apps
    "apps.auth_app",
    "apps.pins",
    "apps.sequences",
    "apps.triggers",
    "apps.device",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", # Sıralama önemli
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "pischeduler.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "pischeduler.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / os.environ.get("DB_NAME", "pischeduler.db"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/" # Eksikti, eklendi

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

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

# Hata payını azaltmak için CORS kısmını daha güvenli hale getirdik
try:
    CORS_ALLOWED_ORIGINS = json.loads(
        os.environ.get("CORS_ORIGINS", '["http://localhost:3000","http://localhost:5173"]')
    )
except (json.JSONDecodeError, TypeError):
    CORS_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]

CORS_ALLOW_CREDENTIALS = True

GPIO_MOCK = os.environ.get("GPIO_MOCK", "True").lower() == "true"
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# MQTT (paho) — edge bridge: HTTP API publishes; optional subscriber merges feedback
MQTT_ENABLED = os.environ.get("MQTT_ENABLED", "True").lower() == "true"
MQTT_SUBSCRIBER_ENABLED = os.environ.get("MQTT_SUBSCRIBER_ENABLED", "True").lower() == "true"
MQTT_ECHO_COMMANDS = os.environ.get("MQTT_ECHO_COMMANDS", "True").lower() == "true"
MQTT_BROKER_HOST = os.environ.get("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.environ.get("MQTT_BROKER_PORT", "1883"))
MQTT_KEEPALIVE = int(os.environ.get("MQTT_KEEPALIVE", "60"))
MQTT_CLIENT_ID_PREFIX = os.environ.get("MQTT_CLIENT_ID_PREFIX", "pischeduler")
MQTT_TOPIC_STATUS = os.environ.get("MQTT_TOPIC_STATUS", "piorchestrator/device/status")
MQTT_TOPIC_COMMANDS = os.environ.get("MQTT_TOPIC_COMMANDS", "piorchestrator/device/commands")
MQTT_TOPIC_FEEDBACK = os.environ.get("MQTT_TOPIC_FEEDBACK", "piorchestrator/device/feedback")

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