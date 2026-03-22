export default function StatusDot({ active }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${
        active ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}
