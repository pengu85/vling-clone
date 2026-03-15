import dynamic from "next/dynamic";

const MonitorTrendChart = dynamic(
  () => import("./MonitorTrendChart").then((m) => ({ default: m.MonitorTrendChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
    ),
  }
);

export { MonitorTrendChart as LazyMonitorTrendChart };
