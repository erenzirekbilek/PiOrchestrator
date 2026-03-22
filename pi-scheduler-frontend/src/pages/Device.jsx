import { useState } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Radio,
  Thermometer,
  Wifi,
  RefreshCw,
  Power,
} from "lucide-react";
import { useDeviceStatus, sendDeviceCommand } from "../hooks/useDeviceStatus";
import { formatApiError } from "../api/formatApiError";

function Card({ icon: Icon, title, children, accent = "text-blue-500" }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-3">
        <Icon size={22} className={accent} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Device() {
  const { data, loading, error, refetch } = useDeviceStatus(3000);
  const [pin, setPin] = useState("17");
  const [cmdBusy, setCmdBusy] = useState(false);
  const [cmdMsg, setCmdMsg] = useState("");

  const runCmd = async (cmd) => {
    setCmdBusy(true);
    setCmdMsg("");
    try {
      const res = await sendDeviceCommand(cmd, pin.trim() || null);
      setCmdMsg(res.ok ? "Komut MQTT üzerinden yayınlandı." : (res.mqtt_error || res.detail || "Hata"));
      refetch();
    } catch (e) {
      setCmdMsg(formatApiError(e));
    } finally {
      setCmdBusy(false);
    }
  };

  const fb = data?.last_mqtt_feedback;
  let feedbackPreview = "—";
  if (fb?.payload) {
    try {
      const j = JSON.parse(fb.payload);
      feedbackPreview = JSON.stringify(j, null, 2);
    } catch {
      feedbackPreview = fb.payload;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device</h1>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                     hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <Card icon={Cpu} title="CPU & mode" accent="text-blue-500">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.cpu_percent != null ? `${data.cpu_percent}%` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Mode: <span className="font-mono">{data?.mode ?? "—"}</span>
          </p>
          <p className="text-xs text-gray-500">
            Host: {data?.hostname ?? "—"} · {data?.platform ?? ""}
          </p>
        </Card>

        <Card icon={Activity} title="Memory" accent="text-emerald-500">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.memory_percent != null ? `${data.memory_percent}%` : "—"}
          </p>
        </Card>

        <Card icon={Thermometer} title="Temperature" accent="text-orange-500">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.temp_c != null ? `${data.temp_c}°C` : "—"}
          </p>
        </Card>

        <Card icon={HardDrive} title="Disk" accent="text-violet-500">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.disk_percent != null ? `${data.disk_percent}%` : "—"}
          </p>
        </Card>

        <Card icon={Wifi} title="Status" accent="text-cyan-500">
          <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {data?.status ?? "—"}
          </p>
          <p className="text-xs text-gray-500 mt-2 break-all">
            {data?.timestamp ?? "—"}
          </p>
        </Card>

        <Card icon={Radio} title="MQTT" accent="text-green-500">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {data?.mqtt?.broker ?? "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1 break-all">
            Status publish: {data?.mqtt_log ?? "—"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Power size={18} className="text-blue-500" />
            MQTT komutları
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            İstekler <span className="font-mono">{data?.mqtt?.commands_topic ?? "…/commands"}</span> konusuna
            JSON olarak gider; edge cihaz veya mock echo geri bildirimi{" "}
            <span className="font-mono">{data?.mqtt?.feedback_topic ?? "…/feedback"}</span> üzerinden döner.
          </p>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">BCM pin (opsiyonel)</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="17"
            className="w-full max-w-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-4
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex flex-wrap gap-2">
            {["status", "on", "off", "toggle"].map((c) => (
              <button
                key={c}
                type="button"
                disabled={cmdBusy}
                onClick={() => runCmd(c)}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white capitalize"
              >
                {c}
              </button>
            ))}
          </div>
          {cmdMsg && <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">{cmdMsg}</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Son MQTT geri bildirimi</h3>
          <p className="text-xs text-gray-500 mb-2">
            Topic: <span className="font-mono">{fb?.topic ?? "—"}</span>
          </p>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900/80 rounded-lg p-3 overflow-auto max-h-48 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700">
            {feedbackPreview}
          </pre>
        </div>
      </div>
    </div>
  );
}
