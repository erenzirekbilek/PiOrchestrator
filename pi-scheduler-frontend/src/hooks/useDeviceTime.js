import { useState, useEffect } from "react";
import client from "../api/client";

export function useDeviceTime() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const { data } = await client.get("/device/time/");
        const raw = data?.datetime ?? data?.time;
        const d = raw != null ? new Date(raw) : new Date();
        setTime(Number.isNaN(d.getTime()) ? new Date() : d);
      } catch {
        setTime(new Date());
      }
    };

    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
