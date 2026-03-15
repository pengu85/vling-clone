"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-400 mb-4">
      <Link href="/" className="hover:text-white transition-colors">홈</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
          ) : (
            <span className="text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
