import { useState, useEffect, useCallback } from "react";
import client from "../api/client";

export function useDeviceStatus(pollMs = 2500) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: body } = await client.get("/device/");
      setData(body);
      setError(null);
    } catch (e) {
      setError(e.message || "Failed to load device");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, pollMs);
    return () => clearInterval(id);
  }, [fetchStatus, pollMs]);

  return { data, loading, error, refetch: fetchStatus };
}

export async function sendDeviceCommand(cmd, pin = null) {
  const payload = { cmd };
  if (pin != null && pin !== "") payload.pin = Number(pin);
  const { data } = await client.post("/device/command/", payload);
  return data;
}
