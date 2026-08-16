import { randomUUID } from "node:crypto";

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

  const render = request.body && typeof request.body === "object" ? request.body : {};
  const externalId = typeof render.externalId === "string" && render.externalId.trim()
    ? render.externalId.trim()
    : `render-${randomUUID()}`;
  const eventType = render.status === "completed" ? "render.completed" : "render.created";

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
        data: {
          externalId,
          originalImageUrl: render.originalImageUrl,
          resultImageUrl: render.resultImageUrl,
          prompt: render.prompt,
          style: render.style,
        },
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
