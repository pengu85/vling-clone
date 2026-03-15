import { AIInsightPanel } from "@/components/channel/AIInsightPanel";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChannelAIInsightPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "AI 인사이트" }]} />
        <AIInsightPanel channelId={id} />
      </div>
    </div>
  );
}
