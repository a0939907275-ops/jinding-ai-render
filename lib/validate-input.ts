export function validateTextFields(fields: Record<string, string>, maxTotal = 12000) {
  const total = Object.values(fields).reduce((sum, value) => sum + value.length, 0);
  if (total > maxTotal) throw new Error(`輸入內容過長，總計最多 ${maxTotal} 個字`);
}
