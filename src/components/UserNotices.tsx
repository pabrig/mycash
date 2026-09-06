"use client";

import { useAuth } from "@/context/AuthContext";

export function UserNotices() {
  const { notices, dismissNotice } = useAuth();

  if (notices.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="bento flex items-start justify-between gap-3 animate-fade-in"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              {notice.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted-fg)]">
              {notice.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dismissNotice(notice.id)}
            className="shrink-0 text-xs font-semibold text-primary"
          >
            Listo
          </button>
        </div>
      ))}
    </div>
  );
}
