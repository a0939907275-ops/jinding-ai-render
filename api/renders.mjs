import { randomUUID } from "node:crypto";
import { normalizeRender } from "../render-payload.mjs";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const platformUrl = process.env.JINDING_PLATFORM_URL?.replace(/\/$/, "");
  const secret = process.env.JINDING_INTEGRATION_SECRET;
  if (!platformUrl || !secret) {
    return response.status(503).json({ error: "Integration is not configured" });
  }

  const input = request.body && typeof request.body === "object" ? request.body : {};
  let render;
  try {
    render = normalizeRender(input);
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : "Invalid render" });
  }
  const externalId = typeof input.externalId === "string" && input.externalId.trim()
    ? input.externalId.trim().slice(0, 240)
    : `render-${randomUUID()}`;
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
    return response.status(upstream.ok ? 201 : 502).json(
      upstream.ok ? { ok: true, externalId, eventType } : result,
    );
  } catch (error) {
    console.error("Unable to sync render", error);
    return response.status(502).json({ error: "Unable to reach control center" });
  }
}
