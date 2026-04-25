import path from "node:path";
import { extractGraph, type ExtractOptions } from "./deterministic";
import { runClusterPass } from "./cluster";
import { summarizeFiles } from "./summarize";
import { hashRepo, readCache, writeCache } from "./cache";
import type { Graph } from "./types";

export type ExtractResult = {
  graph: Graph;
  clusterSource: "llm" | "fallback";
  clusterReason?: string;
  cached: boolean;
};

export async function extract(
  rootDir: string,
  opts?: { skipCache?: boolean; tsConfigFilePath?: string },
): Promise<ExtractResult> {
  const tsConfigFilePath =
    opts?.tsConfigFilePath ?? path.join(rootDir, "tsconfig.json");

  const extractOpts: ExtractOptions = { rootDir, tsConfigFilePath };
  const det = extractGraph(extractOpts);

  const files = Array.from(new Set(det.nodes.map((n) => n.file))).sort();
  const cacheKey = hashRepo(rootDir, files);

  if (!opts?.skipCache) {
    const cached = readCache<Graph>(rootDir, cacheKey);
    if (cached) {
      return {
        graph: cached,
        clusterSource: cached.clusters.length > 0 ? "llm" : "fallback",
        cached: true,
      };
    }
  }

  const summaries = summarizeFiles(det);
  const cluster = await runClusterPass(det, summaries);

  const refined = applyCluster(det, cluster.clusters, cluster.refinedKinds);
  writeCache(rootDir, cacheKey, refined);

  return {
    graph: refined,
    clusterSource: cluster.source,
    clusterReason: cluster.reason,
    cached: false,
  };
}

function applyCluster(
  base: Graph,
  clusters: Graph["clusters"],
  refinedKinds: Map<string, Graph["nodes"][number]["kind"]>,
): Graph {
  const clusterByNode = new Map<string, string>();
  for (const c of clusters) {
    for (const id of c.nodeIds) clusterByNode.set(id, c.id);
  }
  const nodes = base.nodes.map((n) => ({
    ...n,
    kind: refinedKinds.get(n.id) ?? n.kind,
    cluster: clusterByNode.get(n.id),
  }));
  return { ...base, nodes, clusters };
}
