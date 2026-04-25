"use client";

import { useStore } from "@/state/store";
import { CanvasShell } from "@/components/canvas/CanvasShell";
import { GraphCanvas } from "@/components/canvas/GraphCanvas";
import { TopBar } from "@/components/canvas/TopBar";
import { OpsMenu } from "@/components/canvas/OpsMenu";
import { SidePanel } from "@/components/canvas/SidePanel";
import { EmptyState } from "@/components/canvas/EmptyState";
import { Shortcuts } from "@/components/canvas/Shortcuts";
import { StatusPill } from "@/components/canvas/StatusPill";
import { Toast } from "@/components/canvas/Toast";

export default function Page() {
  const graph = useStore((s) => s.graph);

  return (
    <CanvasShell
      topBar={<TopBar status={<StatusPill />} subtitle={graph ? "demo-app" : ""} />}
      rightPanel={<SidePanel />}
    >
      <Shortcuts />
      {graph ? (
        <>
          <GraphCanvas />
          <OpsMenu />
          <Toast />
        </>
      ) : (
        <EmptyState />
      )}
    </CanvasShell>
  );
}
