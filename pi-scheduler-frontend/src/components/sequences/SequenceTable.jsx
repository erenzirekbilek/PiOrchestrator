import { Play, Calendar, Pencil, Copy, Trash2 } from "lucide-react";

export default function SequenceTable({
  sequences,
  loading,
  onRun,
  onCopy,
  onDelete,
  onAddTrigger,
}) {
  const rows = Array.isArray(sequences) ? sequences : [];
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
          {rows.map((seq) => (
            <tr
              key={seq.id}
              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="p-4 font-medium text-gray-900 dark:text-white">{seq.name}</td>
              <td className="p-4 text-gray-500 dark:text-gray-400">
                {seq.last_run
                  ? new Date(seq.last_run).toLocaleString()
                  : "Never"}
              </td>
              <td className="p-4 text-gray-500 dark:text-gray-400">
                {seq.trigger_count > 0
                  ? `${seq.trigger_count} Triggers`
                  : "no triggers"}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <ActionBtn icon={Play} onClick={() => onRun(seq.id)} title="Run" />
                  <ActionBtn
                    icon={Calendar}
                    onClick={() => onAddTrigger?.(seq.id)}
                    title="Add Trigger"
                  />
                  <ActionBtn icon={Pencil} onClick={() => {}} title="Edit" />
                  <ActionBtn icon={Copy} onClick={() => onCopy(seq.id)} title="Copy" />
                  <ActionBtn icon={Trash2} onClick={() => onDelete(seq.id)} title="Delete" danger />
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
