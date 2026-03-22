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
