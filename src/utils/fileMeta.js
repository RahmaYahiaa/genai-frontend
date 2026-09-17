export function fmtBytes(n) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKind(name, mime) {
  const ext = (name?.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf") return { tag: "PDF", color: "#e05252" };
  if (ext === "doc" || ext === "docx") return { tag: "DOC", color: "#4a7dff" };
  if (ext === "ppt" || ext === "pptx") return { tag: "SLIDES", color: "#e08a3c" };
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return { tag: "SHEET", color: "#3ca06c" };
  if (ext === "mp4" || ext === "mov" || ext === "mkv" || ext === "webm") return { tag: "VIDEO", color: "#8a63d2" };
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "svg" || ext === "webp") return { tag: "IMG", color: "#3ca06c" };
  if (ext === "zip" || ext === "rar" || ext === "7z") return { tag: "ARCHIVE", color: "#8a8f98" };
  if (ext === "md" || ext === "txt" || (mime ?? "").startsWith("text/")) return { tag: "TEXT", color: "#8a8f98" };
  return { tag: ext ? ext.toUpperCase().slice(0, 6) : "FILE", color: "#8a8f98" };
}