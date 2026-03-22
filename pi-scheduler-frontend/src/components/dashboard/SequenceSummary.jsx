import { useSequences } from "../../hooks/useSequences";
import { ListOrdered } from "lucide-react";

export default function SequenceSummary() {
  const { sequences } = useSequences();
  const list = Array.isArray(sequences) ? sequences : [];

  const total = list.length;
  const active = list.filter((s) => s?.is_active).length;
  const running = list.filter((s) => s?.is_running).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Sequence Summary
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered size={16} className="text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Total</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">{active}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Running</span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{running}</span>
        </div>
      </div>
    </div>
  );
}
