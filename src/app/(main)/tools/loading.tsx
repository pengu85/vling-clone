export default function ToolsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Header */}
      <div className="h-8 w-64 rounded bg-slate-800 mb-2" />
      <div className="h-4 w-96 rounded bg-slate-800 mb-8" />

      {/* Input area */}
      <div className="rounded-xl border border-slate-800 p-6 mb-6">
        <div className="h-4 w-32 rounded bg-slate-800 mb-4" />
        <div className="h-12 rounded-lg bg-slate-800 mb-4" />
        <div className="h-10 w-32 rounded-lg bg-slate-800" />
      </div>

      {/* Results area */}
      <div className="rounded-xl border border-slate-800 p-6">
        <div className="h-4 w-24 rounded bg-slate-800 mb-4" />
        <div className="space-y-3">
          <div className="h-16 rounded bg-slate-800" />
          <div className="h-16 rounded bg-slate-800" />
          <div className="h-16 rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
