# Pi Scheduler — Frontend Uygulama Rehberi

## Teknoloji Seçimleri

| Araç | Sürüm | Açıklama |
|---|---|---|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool (Create React App yerine) |
| React Router DOM | 6+ | Sayfa yönlendirme |
| Tailwind CSS | 3+ | Utility-first stil |
| shadcn/ui | latest | Hazır bileşenler (Modal, Toggle, Slider) |
| Axios | 1+ | HTTP istekleri |
| date-fns | 3+ | Tarih formatlama |
| Lucide React | latest | İkonlar |

---

## Proje Kurulumu

```bash
# Vite + React projesi oluştur
npm create vite@latest pi-scheduler-frontend -- --template react
cd pi-scheduler-frontend
npm install

# Bağımlılıkları yükle
npm install react-router-dom axios date-fns lucide-react
npm install -D tailwindcss postcss autoprefixer

# Tailwind başlat
npx tailwindcss init -p

# shadcn/ui başlat
npx shadcn-ui@latest init
```

### `tailwind.config.js`
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        success: "#16A34A",
        danger:  "#DC2626",
        warning: "#D97706",
      },
    },
  },
  plugins: [],
};
```

### `vite.config.js` — API proxy ayarı
```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",  // FastAPI
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

---

## Klasör Yapısı

```
src/
├── api/
│   └── client.js            # Axios instance
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   ├── dashboard/
│   │   ├── DeviceClock.jsx
│   │   ├── PinList.jsx
│   │   └── SequenceSummary.jsx
│   ├── sequences/
│   │   ├── SequenceTable.jsx
│   │   ├── SequenceRow.jsx
│   │   ├── AddSequenceModal.jsx
│   │   └── ChannelSlider.jsx
│   └── ui/
│       ├── StatusDot.jsx
│       └── ConfirmDialog.jsx
├── hooks/
│   ├── useSequences.js
│   ├── usePins.js
│   └── useDeviceTime.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Sequences.jsx
│   └── Device.jsx
├── store/
│   └── authStore.js          # Zustand (opsiyonel) veya Context
├── App.jsx
└── main.jsx
```

---

## `src/api/client.js`

```js
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Her istekte JWT token ekle
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → login'e yönlendir
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;
```

---

## `src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## `src/App.jsx`

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar  from "./components/layout/Topbar";
import Dashboard  from "./pages/Dashboard";
import Sequences  from "./pages/Sequences";
import Device     from "./pages/Device";
import Login      from "./pages/Login";

function PrivateLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          isLoggedIn ? (
            <PrivateLayout>
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/sequences" element={<Sequences />} />
                <Route path="/device"    element={<Device />} />
              </Routes>
            </PrivateLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
```

---

## `src/components/layout/Sidebar.jsx`

```jsx
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListOrdered, Cpu } from "lucide-react";

const links = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { to: "/sequences", icon: ListOrdered,      label: "Sequences" },
  { to: "/device",    icon: Cpu,              label: "Device" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-5 text-lg font-semibold text-gray-900 dark:text-white">
        Pi Scheduler
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

---

## `src/components/layout/Topbar.jsx`

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Languages, LogOut } from "lucide-react";

export default function Topbar() {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6 gap-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">admin</span>
      </div>
      <button
        onClick={logout}
        className="text-sm text-blue-600 hover:underline"
      >
        Logout
      </button>
      <button onClick={() => {}} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <Languages size={18} />
      </button>
      <button onClick={toggleDark} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
```

---

## `src/hooks/useDeviceTime.js`

```js
import { useState, useEffect } from "react";
import client from "../api/client";

export function useDeviceTime() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const { data } = await client.get("/device/time");
        setTime(new Date(data.datetime));
      } catch {
        setTime(new Date()); // fallback: local time
      }
    };

    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
```

---

## `src/hooks/useSequences.js`

```js
import { useState, useEffect, useCallback } from "react";
import client from "../api/client";

export function useSequences() {
  const [sequences, setSequences] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/sequences");
      setSequences(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    const { data } = await client.post("/sequences", payload);
    setSequences((prev) => [...prev, data]);
    return data;
  };

  const remove = async (id) => {
    await client.delete(`/sequences/${id}`);
    setSequences((prev) => prev.filter((s) => s.id !== id));
  };

  const run = async (id) => {
    await client.post(`/sequences/${id}/run`);
  };

  const copy = async (id) => {
    const { data } = await client.post(`/sequences/${id}/copy`);
    setSequences((prev) => [...prev, data]);
    return data;
  };

  return { sequences, loading, error, refetch: fetch, create, remove, run, copy };
}
```

---

## `src/hooks/usePins.js`

```js
import { useState, useEffect } from "react";
import client from "../api/client";

export function usePins(reserved = false) {
  const [pins,    setPins]    = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get(reserved ? "/pins/reserved" : "/pins")
      .then(({ data }) => setPins(data))
      .finally(() => setLoading(false));
  }, [reserved]);

  return { pins, loading };
}
```

---

## `src/pages/Dashboard.jsx`

```jsx
import { useState } from "react";
import DeviceClock    from "../components/dashboard/DeviceClock";
import PinList        from "../components/dashboard/PinList";
import SequenceSummary from "../components/dashboard/SequenceSummary";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DeviceClock />
      <PinList />
      <SequenceSummary />
    </div>
  );
}
```

---

## `src/components/dashboard/DeviceClock.jsx`

```jsx
import { useDeviceTime } from "../../hooks/useDeviceTime";
import { format } from "date-fns";

export default function DeviceClock() {
  const time = useDeviceTime();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Device Time
      </h2>
      {time ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(time, "EEE MMM dd yyyy")}
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
            {format(time, "hh:mm:ss aa")}
          </p>
        </>
      ) : (
        <p className="text-gray-400">Bağlanıyor...</p>
      )}
    </div>
  );
}
```

---

## `src/components/dashboard/PinList.jsx`

```jsx
import { useState } from "react";
import { usePins } from "../../hooks/usePins";
import StatusDot from "../ui/StatusDot";

export default function PinList() {
  const [tab, setTab] = useState("all");
  const { pins } = usePins(tab === "reserved");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700">
        {["all", "reserved"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "all" ? "All Pins" : "Reserved Pins"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {pins.map((pin) => (
          <div key={pin.id} className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">{pin.name}</span>
            <StatusDot active={pin.is_active} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
        <span>Pin</span>
        <span>Status</span>
      </div>
    </div>
  );
}
```

---

## `src/components/ui/StatusDot.jsx`

```jsx
export default function StatusDot({ active }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${
        active ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}
```

---

## `src/pages/Sequences.jsx`

```jsx
import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useSequences } from "../hooks/useSequences";
import SequenceTable    from "../components/sequences/SequenceTable";
import AddSequenceModal from "../components/sequences/AddSequenceModal";

export default function Sequences() {
  const { sequences, loading, refetch, create, remove, run, copy } = useSequences();
  const [tab,       setTab]       = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = sequences.filter((s) => {
    if (tab === "activated") return s.is_active;
    if (tab === "running")   return s.is_running;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sequences</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-6 mb-4 border-b border-gray-200 dark:border-gray-700">
        {["all", "activated", "running"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <SequenceTable
        sequences={filtered}
        loading={loading}
        onRun={run}
        onCopy={copy}
        onDelete={remove}
      />

      {showModal && (
        <AddSequenceModal
          onClose={() => setShowModal(false)}
          onCreate={async (payload) => {
            await create(payload);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
```

---

## `src/components/sequences/SequenceTable.jsx`

```jsx
import { format } from "date-fns";
import { Play, Calendar, Pencil, Copy, Trash2 } from "lucide-react";

export default function SequenceTable({ sequences, loading, onRun, onCopy, onDelete }) {
  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor...</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase">
            <th className="text-left p-4 font-medium">Name</th>
            <th className="text-left p-4 font-medium">Last Run</th>
            <th className="text-left p-4 font-medium">No. Triggers</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sequences.map((seq) => (
            <tr
              key={seq.id}
              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="p-4 font-medium text-gray-900 dark:text-white">{seq.name}</td>
              <td className="p-4 text-gray-500 dark:text-gray-400">
                {seq.last_run
                  ? format(new Date(seq.last_run), "M/d/yyyy, h:mm:ss aa")
                  : "Never"}
              </td>
              <td className="p-4 text-gray-500 dark:text-gray-400">
                {seq.trigger_count > 0
                  ? `${seq.trigger_count} Triggers`
                  : "no triggers"}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <ActionBtn icon={Play}     onClick={() => onRun(seq.id)}    title="Çalıştır" />
                  <ActionBtn icon={Calendar} onClick={() => {}}               title="Tetikleyici ekle" />
                  <ActionBtn icon={Pencil}   onClick={() => {}}               title="Düzenle" />
                  <ActionBtn icon={Copy}     onClick={() => onCopy(seq.id)}   title="Kopyala" />
                  <ActionBtn icon={Trash2}   onClick={() => onDelete(seq.id)} title="Sil" danger />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        danger ? "text-red-500 hover:bg-red-50" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <Icon size={15} />
    </button>
  );
}
```

---

## `src/components/sequences/AddSequenceModal.jsx`

```jsx
import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import ChannelSlider from "./ChannelSlider";

const LENGTH_OPTIONS = [
  { label: "1 Minute",    seconds: 60 },
  { label: "5 Minute",    seconds: 300 },
  { label: "15 Minute",   seconds: 900 },
  { label: "30 Minute",   seconds: 1800 },
  { label: "1 Hour",      seconds: 3600 },
  { label: "Custom",      seconds: null },
];

export default function AddSequenceModal({ onClose, onCreate }) {
  const [name,          setName]          = useState("New Sequence");
  const [isActive,      setIsActive]      = useState(false);
  const [lengthIdx,     setLengthIdx]     = useState(3); // "30 Minute"
  const [customSeconds, setCustomSeconds] = useState(10);
  const [stepSeconds,   setStepSeconds]   = useState(1);
  const [channelInput,  setChannelInput]  = useState("");
  const [channels,      setChannels]      = useState([]);
  const [submitting,    setSubmitting]    = useState(false);

  const selected   = LENGTH_OPTIONS[lengthIdx];
  const totalSteps = Math.ceil(
    (selected.seconds ?? customSeconds) / stepSeconds
  );

  const addChannel = () => {
    const num = parseInt(channelInput, 10);
    if (!num || channels.find((c) => c.channel === num)) return;
    setChannels((prev) => [
      ...prev,
      { channel: num, name: `Channel ${num}`, values: Array(totalSteps).fill(0) },
    ]);
    setChannelInput("");
  };

  const removeChannel = (ch) => {
    setChannels((prev) => prev.filter((c) => c.channel !== ch));
  };

  const updateValues = (ch, values) => {
    setChannels((prev) =>
      prev.map((c) => (c.channel === ch ? { ...c, values } : c))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({
        name,
        is_active:      isActive,
        length_seconds: selected.seconds ?? customSeconds,
        step_seconds:   stepSeconds,
        channels:       channels.map((c) => ({
          pin_channel:  c.channel,
          signal_data:  JSON.stringify(c.values),
        })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add New Sequence
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Ad + Active toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isActive ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
            </label>
          </div>

          {/* Sequence length + Step */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sequence length
              </label>
              <div className="flex gap-2">
                <select
                  value={lengthIdx}
                  onChange={(e) => setLengthIdx(Number(e.target.value))}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LENGTH_OPTIONS.map((o, i) => (
                    <option key={i} value={i}>{o.label}</option>
                  ))}
                </select>
                {selected.seconds === null && (
                  <input
                    type="number"
                    min={1}
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Number(e.target.value))}
                    className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sn"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Step
              </label>
              <select
                value={stepSeconds}
                onChange={(e) => setStepSeconds(Number(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 5, 10, 30, 60].map((s) => (
                  <option key={s} value={s}>
                    {s < 60 ? `${s} Second` : "1 Minute"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kanal ekleme */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Channels
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addChannel()}
                placeholder="Add channel (pin no)"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addChannel}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Kanal sliderları */}
          <div className="space-y-4">
            {channels.map((ch) => (
              <ChannelSlider
                key={ch.channel}
                channel={ch}
                totalSteps={totalSteps}
                onRemove={() => removeChannel(ch.channel)}
                onChange={(values) => updateValues(ch.channel, values)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {submitting ? "Kaydediliyor..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## `src/components/sequences/ChannelSlider.jsx`

```jsx
import { Minus } from "lucide-react";

export default function ChannelSlider({ channel, totalSteps, onRemove, onChange }) {
  const handleChange = (index, value) => {
    const newValues = [...channel.values];
    // Dizinin boyutunu totalSteps'e eşitle
    while (newValues.length < totalSteps) newValues.push(0);
    newValues[index] = Number(value);
    onChange(newValues);
  };

  const values = [...(channel.values ?? [])].slice(0, totalSteps);
  while (values.length < totalSteps) values.push(0);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {channel.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Channel: {channel.channel}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Multi-step slider */}
      <div className="space-y-1">
        {values.length <= 20 ? (
          // Az adım: ayrı ayrı slider göster
          <div className="flex gap-1 items-end h-16">
            {values.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={v}
                  onChange={(e) => handleChange(i, e.target.value)}
                  className="w-full accent-blue-500"
                  style={{ writingMode: "vertical-lr", direction: "rtl", height: "48px" }}
                />
              </div>
            ))}
          </div>
        ) : (
          // Çok adım: tek bir zaman çizelgesi slider'ı (temsili)
          <div>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={50}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">{totalSteps} adım — tam düzenleme sekans editöründe</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## `src/pages/Login.jsx`

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Login() {
  const [username,  setUsername]  = useState("admin");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await client.post("/auth/login", {
        username, password,
      });
      localStorage.setItem("token", data.access_token);
      navigate("/");
    } catch {
      setError("Kullanıcı adı veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pi Scheduler</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Yönetici girişi</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adı"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Geliştirme Ortamını Başlatma

```bash
# Backend çalışırken (port 8000)
cd pi-scheduler-frontend
npm run dev
# → http://localhost:5173
```

## Üretim Build (Pi'ye deploy)

```bash
npm run build
# dist/ klasörü oluşur

# Pi'de Nginx ile serve et:
sudo cp -r dist/* /var/www/pi-scheduler/
```

### Nginx konfigürasyonu (`/etc/nginx/sites-available/pi-scheduler`):
```nginx
server {
    listen 80;
    server_name _;

    root /var/www/pi-scheduler;
    index index.html;

    # React Router için SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API isteklerini FastAPI'ye yönlendir
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pi-scheduler /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Özet: Geliştirme Sırası

1. `npm create vite` → kurulum
2. `api/client.js` → Axios instance
3. `hooks/` → veri katmanı
4. `layout/` → Sidebar + Topbar
5. `pages/Dashboard.jsx` → clock + pinler
6. `pages/Sequences.jsx` → tablo + modal
7. `AddSequenceModal` + `ChannelSlider`
8. `pages/Login.jsx`
9. Build + Nginx deploy
