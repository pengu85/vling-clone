"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Folder as FolderIcon,
  FolderOpen,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
} from "lucide-react";

export interface FolderData {
  id: string;
  name: string;
  channelIds: string[];
}

interface FolderSelectorProps {
  folders: FolderData[];
  activeFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onAdd: (name: string) => void;
  onRemove: (folderId: string) => void;
  onRename: (folderId: string, name: string) => void;
}

function FolderItem({
  folder,
  isActive,
  onSelect,
  onRemove,
  onRename,
}: {
  folder: FolderData;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename(trimmed);
    }
    setEditing(false);
    setEditValue(folder.name);
  }

  function cancelRename() {
    setEditing(false);
    setEditValue(folder.name);
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-lg group transition-colors ${
        isActive
          ? "bg-indigo-600/20 text-indigo-400"
          : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {/* Folder icon / select area */}
      <button
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        {isActive ? (
          <FolderOpen className="h-4 w-4 flex-shrink-0 text-indigo-400" />
        ) : (
          <FolderIcon className="h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
        )}

        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-slate-700 text-slate-100 text-sm px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <span className="flex-1 min-w-0 text-sm truncate">{folder.name}</span>
        )}
      </button>

      {/* Channel count */}
      {!editing && (
        <span className="text-xs text-slate-500 flex-shrink-0">
          {folder.channelIds.length}
        </span>
      )}

      {/* Action buttons */}
      {editing ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              commitRename();
            }}
            className="p-0.5 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancelRename();
            }}
            className="p-0.5 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="p-0.5 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-0.5 rounded text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function NewFolderRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) {
      inputRef.current?.focus();
    }
  }, [adding]);

  function commit() {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setAdding(false);
    setValue("");
  }

  function cancel() {
    setAdding(false);
    setValue("");
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <Plus className="h-4 w-4" />
        새 폴더
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      <FolderIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        placeholder="폴더 이름"
        className="flex-1 min-w-0 bg-slate-700 text-slate-100 text-sm px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
      />
      <button
        onClick={commit}
        className="p-0.5 rounded text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={cancel}
        className="p-0.5 rounded text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function FolderSelector({
  folders,
  activeFolderId,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}: FolderSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const buttonLabel = activeFolder ? activeFolder.name : "전체 채널";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
      >
        {activeFolderId ? (
          <FolderOpen className="h-4 w-4 text-indigo-400 flex-shrink-0" />
        ) : (
          <FolderIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        )}
        <span className="max-w-[140px] truncate">{buttonLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-xl shadow-black/40 p-1.5 flex flex-col gap-0.5">
          {/* All channels option */}
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors w-full text-left ${
              activeFolderId === null
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <FolderIcon
              className={`h-4 w-4 flex-shrink-0 ${activeFolderId === null ? "text-indigo-400" : "text-slate-500"}`}
            />
            <span className="flex-1">전체 채널</span>
            <span className="text-xs text-slate-500">
              {folders.reduce((sum, f) => sum + f.channelIds.length, 0)}
            </span>
          </button>

          {/* Divider */}
          {folders.length > 0 && (
            <div className="h-px bg-slate-800 mx-2 my-1" />
          )}

          {/* Folder list */}
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isActive={activeFolderId === folder.id}
              onSelect={() => {
                onSelect(folder.id);
                setOpen(false);
              }}
              onRemove={() => onRemove(folder.id)}
              onRename={(name) => onRename(folder.id, name)}
            />
          ))}

          {/* Divider before new folder */}
          <div className="h-px bg-slate-800 mx-2 my-1" />

          {/* New folder row */}
          <NewFolderRow onAdd={onAdd} />
        </div>
      )}
    </div>
  );
}
