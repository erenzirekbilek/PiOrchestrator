import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useSequences } from "../hooks/useSequences";
import SequenceTable from "../components/sequences/SequenceTable";
import AddSequenceModal from "../components/sequences/AddSequenceModal";
import AddTriggerModal from "../components/sequences/AddTriggerModal";

export default function Sequences() {
  const { sequences, loading, refetch, create, remove, run, stop, copy } = useSequences();
  const [tab, setTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [triggerForSequenceId, setTriggerForSequenceId] = useState(null);

  const list = Array.isArray(sequences) ? sequences : [];
  const filtered = list.filter((s) => {
    if (tab === "activated") return s.is_active;
    if (tab === "running") return s.is_running;
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
        onRun={tab === "running" ? stop : run}
        onCopy={copy}
        onDelete={remove}
        onAddTrigger={(id) => setTriggerForSequenceId(id)}
      />

      {showModal && (
        <AddSequenceModal
          onClose={() => setShowModal(false)}
          onCreate={create}
        />
      )}

      {triggerForSequenceId != null && (
        <AddTriggerModal
          sequenceId={triggerForSequenceId}
          onClose={() => setTriggerForSequenceId(null)}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
