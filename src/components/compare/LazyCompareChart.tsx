import dynamic from "next/dynamic";

const CompareChart = dynamic(
  () => import("./CompareChart").then((m) => ({ default: m.CompareChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
    ),
  }
);

export { CompareChart as LazyCompareChart };
