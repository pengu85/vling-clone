import { FileSearch, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800">
        <FileSearch className="w-8 h-8 text-slate-400" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-5xl font-bold text-slate-500">404</p>
        <h2 className="text-xl font-semibold text-slate-100">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors"
      >
        <Home className="w-4 h-4" />
        홈으로 돌아가기
      </Link>
    </div>
  );
}
