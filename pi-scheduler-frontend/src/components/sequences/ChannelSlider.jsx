import { useCallback, useMemo, useRef } from "react";
import { Minus, Plus } from "lucide-react";

/** Consecutive "on" runs (value > threshold) for horizontal segment drawing. */
function buildSegments(values, threshold = 50) {
  const segs = [];
  let start = null;
  for (let i = 0; i <= values.length; i++) {
    const on = i < values.length && Number(values[i]) > threshold;
    if (on && start === null) start = i;
    if (!on && start !== null) {
      segs.push({ start, end: i - 1 });
      start = null;
    }
  }
  return segs;
}

export default function ChannelSlider({
  channel,
  lightIndex,
  totalSteps,
  onRemove,
  onChange,
}) {
  const trackRef = useRef(null);

  const values = useMemo(() => {
    const v = [...(channel.values ?? [])];
    while (v.length < totalSteps) v.push(0);
    return v.slice(0, totalSteps);
  }, [channel.values, totalSteps]);

  const segments = useMemo(() => buildSegments(values), [values]);

  const pushValues = useCallback(
    (next) => {
      onChange(next);
    },
    [onChange]
  );

  const toggleStep = useCallback(
    (idx) => {
      if (idx < 0 || idx >= totalSteps) return;
      const next = [...values];
      next[idx] = next[idx] > 50 ? 0 : 100;
      pushValues(next);
    },
    [values, totalSteps, pushValues]
  );

  const handleTrackClick = (e) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.min(
      totalSteps - 1,
      Math.max(0, Math.floor((x / rect.width) * totalSteps))
    );
    toggleStep(idx);
  };

  /** Add a short ON block in the first stretch of zeros (visual "add segment"). */
  const addSegment = () => {
    const next = [...values];
    const block = Math.min(8, Math.max(3, Math.floor(totalSteps / 12)));
    let placed = false;
    for (let i = 0; i <= totalSteps - block; i++) {
      let gap = true;
      for (let j = 0; j < block; j++) {
        if (next[i + j] > 50) {
          gap = false;
          break;
        }
      }
      if (gap) {
        for (let j = 0; j < block; j++) next[i + j] = 100;
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let i = 0; i < Math.min(block, totalSteps); i++) next[i] = 100;
    }
    pushValues(next);
  };

  const tickCount = Math.min(24, Math.max(4, totalSteps));

  return (
    <div className="flex items-stretch gap-3 py-3 border-b border-gray-100 dark:border-gray-700/80 last:border-0">
      <div className="w-28 shrink-0 pt-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Light {lightIndex + 1}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Channel: {channel.channel}
        </p>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div
          ref={trackRef}
          role="presentation"
          onClick={handleTrackClick}
          className="relative h-11 w-full cursor-crosshair select-none"
        >
          {/* Tick marks */}
          <div className="absolute bottom-2 left-0 right-0 h-2 pointer-events-none">
            {Array.from({ length: tickCount + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 w-px h-2 bg-gray-300 dark:bg-gray-600"
                style={{ left: `${(i / tickCount) * 100}%`, transform: "translateX(-50%)" }}
              />
            ))}
          </div>

          {/* Dashed baseline */}
          <div className="absolute bottom-2 left-0 right-0 border-b-2 border-dashed border-gray-300 dark:border-gray-600 pointer-events-none" />

          {/* Blue segments */}
          {segments.map((seg) => {
            const left = (seg.start / totalSteps) * 100;
            const width = ((seg.end - seg.start + 1) / totalSteps) * 100;
            return (
              <div key={`${seg.start}-${seg.end}`}>
                <div
                  className="absolute bottom-3 h-2 rounded-sm bg-blue-500 shadow-sm pointer-events-none"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                  }}
                />
                {/* Nodes at segment ends */}
                <div
                  className="absolute bottom-2.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 shadow pointer-events-none z-[1]"
                  style={{
                    left: `${left}%`,
                    transform: "translateX(-50%)",
                  }}
                />
                <div
                  className="absolute bottom-2.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 shadow pointer-events-none z-[1]"
                  style={{
                    left: `${left + width}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Click timeline to toggle steps (blue = on)
        </p>
      </div>

      <div className="flex flex-col gap-1 shrink-0 justify-center">
        <button
          type="button"
          title="Remove channel"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          title="Add segment block"
          onClick={(e) => {
            e.stopPropagation();
            addSegment();
          }}
          className="p-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
