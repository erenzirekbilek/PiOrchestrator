import { useState, useEffect, useCallback } from "react";
import client from "../api/client";

function asPinList(data) {
  return Array.isArray(data) ? data : [];
}

export function usePins(reserved = false) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return client
      .get(reserved ? "/pins/reserved/" : "/pins/")
      .then(({ data }) => setPins(asPinList(data)))
      .catch(() => setPins([]))
      .finally(() => setLoading(false));
  }, [reserved]);

  useEffect(() => {
    load();
  }, [load]);

  const createPin = async (payload) => {
    await client.post("/pins/", payload);
    await load();
  };

  return { pins, loading, createPin, refetch: load };
}
