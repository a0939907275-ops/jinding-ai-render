const allowedStatuses = new Set(["created", "processing", "completed", "failed"]);

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeRender(input) {
  const requestedStatus = cleanText(input.status, 24).toLowerCase();
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "created";
  const originalImageUrl = cleanText(input.originalImageUrl, 2000) || undefined;
  const resultImageUrl = cleanText(input.resultImageUrl, 2000) || undefined;

  if (status === "created" && !originalImageUrl) {
    throw new Error("originalImageUrl is required when creating a render");
  }
  if (status === "completed" && !resultImageUrl) {
    throw new Error("resultImageUrl is required when completing a render");
  }

  return {
    status,
    projectName: cleanText(input.projectName, 160) || undefined,
    roomType: cleanText(input.roomType, 80) || undefined,
    originalImageUrl,
    resultImageUrl,
    prompt: cleanText(input.prompt, 3000) || undefined,
    style: cleanText(input.style, 120) || undefined,
    errorMessage: cleanText(input.errorMessage, 1000) || undefined,
  };
}
