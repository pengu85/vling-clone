import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Fetch channel title from YouTube API for SEO
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("No API key");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(id)}&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      const title = data.items?.[0]?.snippet?.title;
      if (title) {
        return {
          title: `${title} 채널 분석 | 블링`,
          description: `${title} 유튜브 채널의 구독자, 조회수, 성장률, 예상 수익을 분석합니다.`,
        };
      }
    }
  } catch {
    // Fall through to default
  }
  return {
    title: `채널 분석 | 블링`,
    description: "유튜브 채널의 구독자, 조회수, 성장률, 예상 수익을 분석합니다.",
  };
}

export default function ChannelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
