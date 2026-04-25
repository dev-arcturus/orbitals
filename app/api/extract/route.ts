import { NextResponse } from "next/server";
import { extract } from "@/extractor/extract";
import { resolveRepoPath } from "@/lib/repoPath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const repoPath = resolveRepoPath(body?.repoPath);
    const skipCache = Boolean(body?.skipCache);
    const result = await extract(repoPath, { skipCache });
    return NextResponse.json({ ...result, repoPath });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "extract failed" },
      { status: 500 },
    );
  }
}
