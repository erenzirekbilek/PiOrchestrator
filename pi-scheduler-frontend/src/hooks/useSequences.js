import { useState, useEffect, useCallback } from "react";
import client from "../api/client";

function asSequenceList(data) {
  return Array.isArray(data) ? data : [];
}

export function useSequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/sequences/");
      setSequences(asSequenceList(data));
    } catch (e) {
      setError(e.message);
      setSequences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (payload) => {
    const { data } = await client.post("/sequences/", payload);
    setSequences((prev) => [...prev, data]);
    return data;
  };

  const remove = async (id) => {
    await client.delete(`/sequences/${id}/`);
    setSequences((prev) => prev.filter((s) => s.id !== id));
  };

  const run = async (id) => {
    await client.post(`/sequences/${id}/run/`);
    await fetch();
  };

  const stop = async (id) => {
    await client.post(`/sequences/${id}/stop/`);
    await fetch();
  };

  const copy = async (id) => {
    const { data } = await client.post(`/sequences/${id}/copy/`);
    setSequences((prev) => [...prev, data]);
    return data;
  };

  return { sequences, loading, error, refetch: fetch, create, remove, run, stop, copy };
}
