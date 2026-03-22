"""
MQTT bridge: publish status/commands, optional subscriber for commands + feedback.
Uses short-lived publish clients; daemon thread subscribes for real-time merge.
"""

from __future__ import annotations

import json
import logging
import threading
import time
from collections import deque
from typing import Any

import paho.mqtt.client as mqtt
from django.conf import settings

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_last_feedback: dict[str, Any] = {"topic": None, "payload": None, "ts": None}
_message_history: deque[dict] = deque(maxlen=500)
_subscriber_thread: threading.Thread | None = None
_subscriber_started = False


def _make_client(client_id: str) -> mqtt.Client:
    kwargs: dict[str, Any] = {"client_id": client_id}
    if hasattr(mqtt, "CallbackAPIVersion"):
        kwargs["callback_api_version"] = mqtt.CallbackAPIVersion.VERSION2
    return mqtt.Client(**kwargs)


def mqtt_publish(topic: str, payload: Any, qos: int = 0) -> tuple[bool, str | None]:
    if not getattr(settings, "MQTT_ENABLED", True):
        return False, "MQTT disabled"

    host = getattr(settings, "MQTT_BROKER_HOST", "localhost")
    port = int(getattr(settings, "MQTT_BROKER_PORT", 1883))
    keepalive = int(getattr(settings, "MQTT_KEEPALIVE", 60))

    try:
        body = json.dumps(payload, default=str) if not isinstance(payload, (str, bytes, bytearray)) else payload
        if isinstance(body, str):
            body = body.encode("utf-8")

        cid = f"{getattr(settings, 'MQTT_CLIENT_ID_PREFIX', 'pischeduler')}-pub-{threading.get_ident()}"
        client = _make_client(cid)
        client.connect(host, port, keepalive)
        client.publish(topic, body, qos=qos)
        client.disconnect()

        _add_history("pub", topic, body.decode("utf-8", errors="replace") if isinstance(body, bytes) else body, qos)
        return True, None
    except Exception as exc:
        err = str(exc)
        logger.warning("MQTT publish failed (%s): %s", topic, err)
        return False, err


def get_last_feedback() -> dict[str, Any]:
    with _lock:
        return dict(_last_feedback)


def get_message_history(limit: int = 50) -> list[dict]:
    with _lock:
        return list(_message_history)[-limit:]


def _add_history(direction: str, topic: str, payload: str, qos: int = 0) -> None:
    with _lock:
        _message_history.append({
            "direction": direction,
            "topic": topic,
            "payload": payload,
            "qos": qos,
            "ts": time.time(),
        })


def _set_feedback(topic: str, payload: str) -> None:
    global _last_feedback
    with _lock:
        _last_feedback = {"topic": topic, "payload": payload, "ts": time.time()}


def _on_message(client, userdata, msg):  # noqa: ARG001
    try:
        payload = msg.payload.decode("utf-8", errors="replace")
        topic = msg.topic
        qos = msg.qos

        _add_history("sub", topic, payload, qos)
        _set_feedback(topic, payload)

        commands = getattr(settings, "MQTT_TOPIC_COMMANDS", "piorchestrator/device/commands")
        feedback = getattr(settings, "MQTT_TOPIC_FEEDBACK", "piorchestrator/device/feedback")

        if topic == commands and getattr(settings, "MQTT_ECHO_COMMANDS", True):
            try:
                parsed = json.loads(payload) if payload.strip().startswith("{") else {"raw": payload}
            except json.JSONDecodeError:
                parsed = {"raw": payload}
            echo = {"ok": True, "echo": parsed, "timestamp": time.time()}
            ok, err = mqtt_publish(feedback, echo, qos=0)
            if not ok:
                logger.debug("MQTT echo publish skipped: %s", err)
    except Exception:
        logger.exception("MQTT on_message handler failed")


def _on_connect(client, userdata, flags, reason_code, properties=None):  # noqa: ARG001
    try:
        if hasattr(reason_code, "is_failure") and reason_code.is_failure:
            logger.warning("MQTT subscriber connect failed: %s", reason_code)
            return
    except Exception:
        pass
    client.subscribe(getattr(settings, "MQTT_TOPIC_COMMANDS", "piorchestrator/device/commands"), qos=0)
    client.subscribe(getattr(settings, "MQTT_TOPIC_FEEDBACK", "piorchestrator/device/feedback"), qos=0)
    client.subscribe("piorchestrator/device/+/state", qos=0)
    logger.info("MQTT subscriber connected; subscribed to commands, feedback, and device state topics")


def _subscriber_loop() -> None:
    host = getattr(settings, "MQTT_BROKER_HOST", "localhost")
    port = int(getattr(settings, "MQTT_BROKER_PORT", 1883))
    keepalive = int(getattr(settings, "MQTT_KEEPALIVE", 60))
    cid = f"{getattr(settings, 'MQTT_CLIENT_ID_PREFIX', 'pischeduler')}-sub"

    client = _make_client(cid)
    client.on_connect = _on_connect
    client.on_message = _on_message
    try:
        client.connect(host, port, keepalive)
        client.loop_forever(retry_first_connection=True)
    except Exception:
        logger.exception("MQTT subscriber loop died")


def should_start_subscriber() -> bool:
    if not getattr(settings, "MQTT_ENABLED", True):
        return False
    if not getattr(settings, "MQTT_SUBSCRIBER_ENABLED", True):
        return False
    import os
    import sys
    argv = " ".join(sys.argv)
    if any(x in argv for x in ("check", "migrate", "makemigrations", "test", "shell")):
        return False
    if "runserver" in sys.argv:
        return os.environ.get("RUN_MAIN") == "true"
    return True


def start_subscriber_thread() -> None:
    global _subscriber_thread, _subscriber_started
    if _subscriber_started:
        return
    if not should_start_subscriber():
        return
    _subscriber_started = True
    _subscriber_thread = threading.Thread(target=_subscriber_loop, name="mqtt-subscriber", daemon=True)
    _subscriber_thread.start()
    logger.info("MQTT subscriber thread started")
