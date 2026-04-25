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
import { CommandBar } from "@/components/canvas/CommandBar";
import { PlanPanel } from "@/components/canvas/PlanPanel";
import { PlanProgress } from "@/components/canvas/PlanProgress";
import { CheatSheet } from "@/components/canvas/CheatSheet";
import { BlurOverlay } from "@/components/canvas/BlurOverlay";
import { FullscreenDiffOverlay } from "@/components/canvas/FullscreenDiffOverlay";
import { PresenterToggle } from "@/components/canvas/PresenterToggle";
import { GraphLegend } from "@/components/canvas/GraphLegend";

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
          <FullscreenDiffOverlay />
          <PresenterToggle />
          <GraphLegend />
        </>
      ) : (
        <EmptyState />
      )}
    </CanvasShell>
  );
}
