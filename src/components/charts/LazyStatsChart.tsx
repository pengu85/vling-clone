import dynamic from "next/dynamic";

const StatsChart = dynamic(
  () => import("./StatsChart").then((m) => ({ default: m.StatsChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
    ),
  }
);

export { StatsChart as LazyStatsChart };
