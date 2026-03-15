import dynamic from "next/dynamic";

const GrowthChart = dynamic(
  () => import("./GrowthChart").then((m) => ({ default: m.GrowthChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
    ),
  }
);

export { GrowthChart as LazyGrowthChart };
