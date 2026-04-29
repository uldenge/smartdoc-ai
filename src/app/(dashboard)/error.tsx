"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard 错误:", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold">页面加载失败</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "无法加载此页面，请稍后重试。"}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            重试
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            返回仪表盘
          </a>
        </div>
      </div>
    </div>
  );
}
