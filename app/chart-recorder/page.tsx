import { notFound } from "next/navigation";
import { ChartRecorder } from "@/components/ChartRecorder";
import { CHART_RECORDER_ENABLED } from "@/game/config/features";

export default function ChartRecorderPage() {
  if (!CHART_RECORDER_ENABLED) {
    notFound();
  }

  return <ChartRecorder />;
}
