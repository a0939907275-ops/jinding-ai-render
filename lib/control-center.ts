type RenderStatus = "processing" | "completed" | "failed";

type RenderSyncInput = {
  externalId: string;
  status: RenderStatus;
  projectName?: string;
  roomType?: string;
  prompt?: string;
  style?: string;
  errorMessage?: string;
};

export async function syncRenderEvent(input: RenderSyncInput) {
  const platformUrl = process.env.JINDING_PLATFORM_URL?.replace(/\/$/, "");
  const secret = process.env.JINDING_INTEGRATION_SECRET;
  if (!platformUrl || !secret) return;

  try {
    const response = await fetch(`${platformUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-integration-secret": secret,
      },
      body: JSON.stringify({
        eventId: `render-event-render.${input.status}-${input.externalId}`,
        eventType: `render.${input.status}`,
        source: "interior_render_mvp",
        occurredAt: new Date().toISOString(),
        data: {
          externalId: input.externalId,
          projectName: input.projectName,
          roomType: input.roomType,
          prompt: input.prompt,
          style: input.style,
          errorMessage: input.errorMessage,
          generatedBy: "openai",
        },
      }),
    });

    if (!response.ok) console.error("Unable to sync render event", response.status);
  } catch (error) {
    console.error("Unable to reach control center", error);
  }
}
