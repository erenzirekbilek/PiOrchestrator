/** Flattens DRF validation / error payloads for display. */
export function formatApiError(err) {
  const d = err.response?.data;
  if (!d) return err.message || "Bir hata olustu.";
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((x) => (typeof x === "object" && x?.msg != null ? x.msg : String(x)))
      .join(" ");
  }
  const parts = [];
  if (Array.isArray(d.non_field_errors)) {
    parts.push(...d.non_field_errors);
  }
  for (const [key, val] of Object.entries(d)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(val)) parts.push(`${key}: ${val.join(" ")}`);
    else if (typeof val === "string") parts.push(`${key}: ${val}`);
  }
  return parts.length ? parts.join(" ") : "İstek hatası.";
}
