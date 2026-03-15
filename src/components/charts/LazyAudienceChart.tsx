import dynamic from "next/dynamic";

const AudienceChart = dynamic(
  () => import("./AudienceChart").then((m) => ({ default: m.AudienceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
    ),
  }
);

export { AudienceChart as LazyAudienceChart };
