import { useState } from "react";
import { usePins } from "../../hooks/usePins";
import StatusDot from "../ui/StatusDot";
import { formatApiError } from "../../api/formatApiError";

export default function PinList() {
  const [tab, setTab] = useState("all");
  const reserved = tab === "reserved";
  const { pins, loading, createPin } = usePins(reserved);
  const list = Array.isArray(pins) ? pins : [];

  const [bcm, setBcm] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    const n = parseInt(bcm, 10);
    if (!n || n < 0) {
      setFormError("Geçerli bir BCM pin numarası girin.");
      return;
    }
    if (!name.trim()) {
      setFormError("İsim gerekli.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await createPin({
        bcm: n,
        name: name.trim(),
        is_active: isActive,
        is_reserved: isReserved,
      });
      setBcm("");
      setName("");
      setIsActive(false);
      setIsReserved(false);
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700">
        {["all", "reserved"].map((t) => (
          <button
            key={t}
            type="button"
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

      {loading && (
        <p className="text-sm text-gray-400 mb-3">Yükleniyor...</p>
      )}

      <div className="space-y-2 min-h-[4rem]">
        {list.length === 0 && !loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {reserved ? "Rezerve pin yok." : "Henüz pin yok. Aşağıdan ekleyin."}
          </p>
        ) : (
          list.map((pin) => (
            <div key={pin.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-mono text-xs text-gray-500 mr-2">BCM {pin.bcm}</span>
                {pin.name}
              </span>
              <StatusDot active={pin.is_active} />
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Yeni pin</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            min={0}
            placeholder="BCM"
            value={bcm}
            onChange={(e) => setBcm(e.target.value)}
            className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="İsim"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[120px] border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-700 dark:text-gray-300">Aktif</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isReserved}
              onChange={(e) => setIsReserved(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-700 dark:text-gray-300">Rezerve</span>
          </label>
        </div>
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        <button
          type="submit"
          disabled={saving}
          className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
        >
          {saving ? "Kaydediliyor..." : "Pin ekle"}
        </button>
      </form>

      <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
        <span>Pin</span>
        <span>Status</span>
      </div>
    </div>
  );
}
