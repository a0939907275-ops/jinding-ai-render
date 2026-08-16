import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const port = Number(process.env.PORT || 3400);

function send(response, status, type, body) {
  response.writeHead(status, { "content-type": type });
  response.end(body);
}

async function jsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/") {
    const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
    return send(response, 200, "text/html; charset=utf-8", html.replace("</body>", '<script src="/render-client.js"></script></body>'));
  }
  if (request.method === "GET" && request.url === "/render-client.js") {
    return send(response, 200, "text/javascript; charset=utf-8", await readFile(new URL("./render-client.js", import.meta.url), "utf8"));
  }
  if (request.method === "GET" && request.url === "/health") {
    return send(response, 200, "application/json", JSON.stringify({ ok: true, service: "jinding-ai-render" }));
  }
  if (request.method !== "POST" || request.url !== "/api/renders") {
    return send(response, 404, "application/json", JSON.stringify({ error: "Not found" }));
  }

  const platformUrl = process.env.JINDING_PLATFORM_URL?.replace(/\/$/, "");
  const secret = process.env.JINDING_INTEGRATION_SECRET;
  if (!platformUrl || !secret) return send(response, 503, "application/json", JSON.stringify({ error: "Integration is not configured" }));

  try {
    const render = await jsonBody(request);
    const externalId = `render-${randomUUID()}`;
    const upstream = await fetch(`${platformUrl}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-integration-secret": secret },
      body: JSON.stringify({
        eventId: `render-event-${externalId}`,
        eventType: "render.created",
        source: "interior_render_mvp",
        occurredAt: new Date().toISOString(),
        data: { externalId, originalImageUrl: render.originalImageUrl, prompt: render.prompt, style: render.style },
      }),
    });
    const result = await upstream.json();
    return send(response, upstream.ok ? 201 : 502, "application/json", JSON.stringify(upstream.ok ? { ok: true, externalId } : result));
  } catch (error) {
    console.error(error);
    return send(response, 400, "application/json", JSON.stringify({ error: "Invalid request" }));
  }
}).listen(port, () => console.log(`AI Render MVP listening on ${port}`));
