import DeviceClock from "../components/dashboard/DeviceClock";
import PinList from "../components/dashboard/PinList";
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
