import { randomUUID } from "node:crypto";
import { normalizeRender } from "../../../render-payload.mjs";

export async function POST(request: Request) {
  const platformUrl = process.env.JINDING_PLATFORM_URL?.replace(/\/$/, "");
  const secret = process.env.JINDING_INTEGRATION_SECRET;
  if (!platformUrl || !secret) {
    return Response.json({ error: "Integration is not configured" }, { status: 503 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let render;
  try {
    render = normalizeRender(input);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid render" },
      { status: 400 },
    );
  }

  const requestedId = typeof input.externalId === "string" ? input.externalId.trim() : "";
  const externalId = requestedId ? requestedId.slice(0, 240) : `render-${randomUUID()}`;
  const eventType = `render.${render.status}`;

  try {
    const upstream = await fetch(`${platformUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-integration-secret": secret,
      },
      body: JSON.stringify({
        eventId: `render-event-${eventType}-${externalId}`,
        eventType,
        source: "interior_render_mvp",
        occurredAt: new Date().toISOString(),
        data: { ...render, externalId },
      }),
    });
    const result = await upstream.json();
    return Response.json(
      upstream.ok ? { ok: true, externalId, eventType } : result,
      { status: upstream.ok ? 201 : 502 },
    );
  } catch (error) {
    console.error("Unable to sync render", error);
    return Response.json({ error: "Unable to reach control center" }, { status: 502 });
  }
}
