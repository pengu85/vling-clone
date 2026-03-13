"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Megaphone, Globe, Video, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";
import type { Channel } from "@/types";

interface ChannelProfileProps {
  channel: Channel;
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: "테크",
  beauty: "뷰티",
  gaming: "게임",
  food: "푸드",
  travel: "여행",
  music: "음악",
  sports: "스포츠",
  education: "교육",
  comedy: "코미디",
  pets: "반려동물",
};

const COUNTRY_LABELS: Record<string, string> = {
  KR: "🇰🇷 한국",
  US: "🇺🇸 미국",
  JP: "🇯🇵 일본",
  CN: "🇨🇳 중국",
  TW: "🇹🇼 대만",
  GB: "🇬🇧 영국",
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 flex-1 min-w-0">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-indigo-400">{icon}</span>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
        <p className="text-lg font-bold text-slate-100 truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

export function ChannelProfile({ channel }: ChannelProfileProps) {
  const [favorited, setFavorited] = useState(false);

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      {/* 배너 */}
      <div className="relative w-full h-48 bg-gradient-to-r from-indigo-600 to-violet-600 overflow-hidden">
        {channel.bannerUrl && (
          <Image
            src={channel.bannerUrl}
            alt={`${channel.title} 배너`}
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </div>

      {/* 프로필 정보 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative pb-4">
          {/* 프로필 이미지 - 배너에 겹치게 */}
          <div className="absolute -top-12 left-0">
            <div className="w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden bg-indigo-900 shadow-lg relative">
              {channel.thumbnailUrl ? (
                <Image
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                  {channel.title.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end pt-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`border-slate-700 gap-1.5 ${favorited ? "text-yellow-400 border-yellow-600 bg-yellow-900/20" : "text-slate-400"}`}
              onClick={() => setFavorited((v) => !v)}
            >
              <Star className={`h-4 w-4 ${favorited ? "fill-yellow-400" : ""}`} />
              {favorited ? "즐겨찾기 완료" : "즐겨찾기"}
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-none gap-1.5"
            >
              <Megaphone className="h-4 w-4" />
              캠페인 제안
            </Button>
          </div>

          {/* 채널명 & 메타 */}
          <div className="mt-2 ml-0 pt-10">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-100">{channel.title}</h1>
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[channel.category] ?? channel.category}
              </Badge>
              <span className="text-sm text-slate-500">
                {COUNTRY_LABELS[channel.country] ?? channel.country}
              </span>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2 max-w-2xl">
              {channel.description}
            </p>
          </div>

          {/* 주요 지표 카드 */}
          <div className="flex gap-3 mt-4 flex-wrap sm:flex-nowrap">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="구독자"
              value={formatNumber(channel.subscriberCount)}
            />
            <StatCard
              icon={<Eye className="h-4 w-4" />}
              label="총 조회수"
              value={formatNumber(channel.viewCount)}
            />
            <StatCard
              icon={<Video className="h-4 w-4" />}
              label="영상 수"
              value={formatNumber(channel.videoCount)}
            />
            <StatCard
              icon={<Globe className="h-4 w-4" />}
              label="일평균 조회수"
              value={formatNumber(channel.dailyAvgViews)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
