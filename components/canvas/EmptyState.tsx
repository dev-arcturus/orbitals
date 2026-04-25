"use client";

import { Loader2, Play } from "lucide-react";
import { useStore } from "@/state/store";

export function EmptyState() {
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.loadError);
  const repoPath = useStore((s) => s.repoPath);
  const loadGraph = useStore((s) => s.loadGraph);
  const setRepoPath = useStore((s) => s.setRepoPath);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-[440px] rounded-lg border border-canvas-border bg-canvas-panel/90 px-5 py-5 shadow-panel backdrop-blur">
        <div className="text-base font-medium text-canvas-ink">
          Schema · brownfield architecture editor
        </div>
        <div className="mt-1 text-xs text-canvas-muted">
          Point at a TypeScript repo. Schema reverse-engineers an architecture
          graph and lets you edit it.
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-2xs uppercase tracking-wider text-canvas-subtle">
            Repository path
          </label>
          <input
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            className="rounded border border-canvas-border bg-canvas-bg/60 px-3 py-2 font-mono text-xs text-canvas-ink outline-none focus:border-accent"
            placeholder="fixtures/demo-app"
          />
          <button
            onClick={loadGraph}
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded bg-accent px-3 py-2 text-xs font-medium text-canvas-bg disabled:opacity-50 hover:brightness-110"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {loading ? "Extracting…" : "Extract graph"}
          </button>
        </div>
        {error ? (
          <div className="mt-3 rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-2xs text-rose-200">
            {error}
          </div>
        ) : (
          <div className="mt-3 text-2xs text-canvas-subtle">
            Defaults to the bundled demo (Express + sqlite + JWT, with a
            deliberate auth gap).
          </div>
        )}
      </div>
    </div>
  );
}
