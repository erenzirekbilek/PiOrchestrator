import { useState, useEffect } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import ChannelSlider from "./ChannelSlider";
import { formatApiError } from "../../api/formatApiError";

const LENGTH_OPTIONS = [
  { label: "1 Minute", seconds: 60 },
  { label: "5 Minute", seconds: 300 },
  { label: "15 Minute", seconds: 900 },
  { label: "30 Minute", seconds: 1800 },
  { label: "1 Hour", seconds: 3600 },
  { label: "Custom", seconds: null },
];

export default function AddSequenceModal({ onClose, onCreate }) {
  const [name, setName] = useState("New Sequence");
  const [isActive, setIsActive] = useState(false);
  const [lengthIdx, setLengthIdx] = useState(0);
  const [customSeconds, setCustomSeconds] = useState(60);
  const [stepSeconds, setStepSeconds] = useState(1);
  const [channelInput, setChannelInput] = useState("");
  const [channels, setChannels] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selected = LENGTH_OPTIONS[lengthIdx];
  const totalSteps = Math.max(
    1,
    Math.ceil((selected.seconds ?? customSeconds) / stepSeconds)
  );

  useEffect(() => {
    setChannels((prev) =>
      prev.map((c) => {
        const v = [...(c.values ?? [])];
        while (v.length < totalSteps) v.push(0);
        return { ...c, values: v.slice(0, totalSteps) };
      })
    );
  }, [totalSteps]);

  const addChannel = () => {
    const num = parseInt(channelInput, 10);
    if (!num || channels.find((c) => c.channel === num)) return;
    setChannels((prev) => [
      ...prev,
      { channel: num, values: Array(totalSteps).fill(0) },
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
    setSubmitError("");
    try {
      await onCreate({
        name,
        is_active: isActive,
        length_seconds: selected.seconds ?? customSeconds,
        step_seconds: stepSeconds,
        channels: channels.map((c) => ({
          pin_channel: c.channel,
          signal_data: JSON.stringify(c.values),
        })),
      });
      onClose();
    } catch (e) {
      setSubmitError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add New Sequence
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 pb-1">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Sequence length
              </label>
              <div className="flex gap-2 items-stretch">
                <div className="relative flex-1">
                  <select
                    value={lengthIdx}
                    onChange={(e) => setLengthIdx(Number(e.target.value))}
                    className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-10 py-2.5 text-sm
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LENGTH_OPTIONS.map((o, i) => (
                      <option key={i} value={i}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <ChevronDown size={18} />
                  </span>
                </div>
                {selected.seconds === null && (
                  <input
                    type="number"
                    min={1}
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Number(e.target.value))}
                    className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2.5 text-sm
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sec"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Step
              </label>
              <select
                value={stepSeconds}
                onChange={(e) => setStepSeconds(Number(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm
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

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Channels
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addChannel()}
                placeholder="Add channel"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addChannel}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700
                           text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                aria-label="Add channel"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 px-3">
            {channels.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                Add a channel to edit the timeline
              </p>
            ) : (
              channels.map((ch, i) => (
                <ChannelSlider
                  key={ch.channel}
                  lightIndex={i}
                  channel={ch}
                  totalSteps={totalSteps}
                  onRemove={() => removeChannel(ch.channel)}
                  onChange={(values) => updateValues(ch.channel, values)}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
          >
            {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
