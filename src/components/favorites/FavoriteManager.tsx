"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Folder,
  FolderPlus,
  Trash2,
  Star,
  MoveRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { formatNumber } from "@/lib/formatters";
import { CATEGORIES } from "@/domain/categories";

export function FavoriteManager() {
  const folders = useFavoriteStore((s) => s.folders);
  const addFolder = useFavoriteStore((s) => s.addFolder);
  const removeFolder = useFavoriteStore((s) => s.removeFolder);
  const removeFavorite = useFavoriteStore((s) => s.removeFavorite);
  const moveFavorite = useFavoriteStore((s) => s.moveFavorite);
  const getFolderChannels = useFavoriteStore((s) => s.getFolderChannels);

  const [selectedFolder, setSelectedFolder] = useState<string>("기본");
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const channelsInFolder = getFolderChannels(selectedFolder);

  function handleAddFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    addFolder(trimmed);
    setNewFolderName("");
    setDialogOpen(false);
    setSelectedFolder(trimmed);
  }

  function handleRemoveFolder(name: string) {
    if (name === "기본") return;
    if (selectedFolder === name) setSelectedFolder("기본");
    removeFolder(name);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 min-h-[500px]">
      {/* 폴더 사이드바 */}
      <aside className="w-full md:w-60 shrink-0 flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            폴더
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="sr-only">새 폴더</span>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-slate-100">새 폴더 만들기</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="폴더 이름 입력"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <DialogClose
                  className="inline-flex h-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  취소
                </DialogClose>
                <Button
                  size="sm"
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  만들기
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-0.5">
          {folders.map((folder) => {
            const count = getFolderChannels(folder).length;
            const isActive = selectedFolder === folder;
            return (
              <button
                type="button"
                key={folder}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors text-left w-full",
                  isActive
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
                onClick={() => setSelectedFolder(folder)}
              >
                <Folder
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-violet-400" : "text-slate-500"
                  )}
                />
                <span className="flex-1 truncate text-sm">{folder}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-4 min-w-[1.25rem] px-1 text-[10px] border-0",
                    isActive
                      ? "bg-violet-600/40 text-violet-300"
                      : "bg-slate-700 text-slate-400"
                  )}
                >
                  {count}
                </Badge>
                {folder !== "기본" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFolder(folder);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                    aria-label={`${folder} 폴더 삭제`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* 채널 목록 */}
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <Folder className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-200">{selectedFolder}</h2>
          <span className="text-xs text-slate-500">{channelsInFolder.length}개 채널</span>
        </div>

        {channelsInFolder.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/50 py-20 text-center">
            <Star className="mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm font-medium text-slate-400">즐겨찾기한 채널이 없습니다</p>
            <p className="mt-1 text-xs text-slate-600">
              채널 검색에서 별 아이콘을 눌러 추가해보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channelsInFolder.map(({ channel }) => {
              const categoryLabel =
                CATEGORIES.find((c) => c.value === channel.category)?.label ??
                channel.category;

              return (
                <div
                  key={channel.id}
                  className="group relative flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 hover:border-slate-700 transition-colors"
                >
                  {/* 채널 정보 */}
                  <Link
                    href={`/channel/${channel.id}`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700">
                      {channel.thumbnailUrl ? (
                        <Image
                          src={channel.thumbnailUrl}
                          alt={channel.title}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 font-medium">
                          {channel.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100 group-hover:text-violet-300 transition-colors">
                        {channel.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
                        >
                          {categoryLabel}
                        </Badge>
                        <span className="text-[10px] text-slate-500">
                          {formatNumber(channel.subscriberCount)} 구독자
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1.5 border-t border-slate-800 pt-2.5">
                    {/* 폴더 이동 */}
                    {folders.length > 1 && (
                      <div className="relative flex-1">
                        <select
                          value={selectedFolder}
                          onChange={(e) => moveFavorite(channel.id, e.target.value)}
                          className="w-full appearance-none rounded-md border border-slate-700 bg-slate-800 px-2 py-1 pr-6 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {folders.map((f) => (
                            <option key={f} value={f} className="bg-slate-800">
                              {f}
                            </option>
                          ))}
                        </select>
                        <MoveRight className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                      </div>
                    )}

                    {/* 삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFavorite(channel.id)}
                      className="h-6 w-6 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      aria-label="즐겨찾기 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
