"""Device / edge metrics: mock (Windows / GPIO_MOCK) or real (Linux + psutil)."""

from __future__ import annotations

import logging
import platform
import random
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


def _read_cpu_temp_c() -> float | None:
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", encoding="utf-8") as f:
            return round(int(f.read()) / 1000, 1)
    except (OSError, ValueError):
        return None


def get_device_stats() -> dict[str, Any]:
    """Return CPU, memory, disk, temperature, and mode for API + MQTT payloads."""
    mock = getattr(settings, "GPIO_MOCK", True) or platform.system() == "Windows"

    if mock:
        return {
            "mode": "VIRTUAL_MQTT_MOCK",
            "cpu_percent": round(random.uniform(12, 32), 1),
            "memory_percent": round(random.uniform(35, 65), 1),
            "disk_percent": round(random.uniform(45, 78), 1),
            "temp_c": round(random.uniform(42, 52), 1),
            "hostname": platform.node() or "mock-edge",
            "platform": platform.system(),
            "status": "online",
        }

    try:
        import psutil

        temp = _read_cpu_temp_c()
        return {
            "mode": "REAL_HARDWARE",
            "cpu_percent": round(psutil.cpu_percent(interval=0.15), 1),
            "memory_percent": round(psutil.virtual_memory().percent, 1),
            "disk_percent": round(psutil.disk_usage("/").percent, 1),
            "temp_c": temp,
            "hostname": platform.node(),
            "platform": platform.system(),
            "status": "online",
        }
    except Exception as exc:  # pragma: no cover
        logger.warning("hardware read failed: %s", exc)
        return {
            "mode": "error",
            "status": "degraded",
            "error": str(exc),
        }
