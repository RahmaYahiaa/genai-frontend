import { api, apiFull, API_BASE, readSession } from "@/services/http";

// Study Tools (EDUNation parity): grounded learning-resource generation.
// Text kinds return structured content; diagram/presentation return real
// downloadable artifacts; media kinds come back as honest "unavailable".
// AI study-tools generation contract: 15 documented kinds.
export const RESOURCE_KINDS = [
  "summary",
  "notes",
  "flashcards",
  "quiz",
  "code",
  "diagram",
  "presentation",
  "explanation",
  "study_guide",
  "coding_exercise",
  "analogy",
  "comparison",
  "exam",
  "practice",
  "question_bank",
];

export const KIND_LABELS = {
  summary: { en: "Summary", ar: "ملخص" },
  notes: { en: "Study Notes", ar: "مذكرة منظمة" },
  flashcards: { en: "Flashcards", ar: "بطاقات مراجعة" },
  quiz: { en: "Practice Quiz", ar: "اختبار تدريبي" },
  code: { en: "Code Example", ar: "مثال برمجي" },
  diagram: { en: "Diagram", ar: "مخطط" },
  presentation: { en: "Presentation", ar: "عرض تقديمي" },
  explanation: { en: "Explanation", ar: "شرح" },
  study_guide: { en: "Study Guide", ar: "دليل المذاكرة" },
  coding_exercise: { en: "Coding Exercise", ar: "تمرين برمجي" },
  analogy: { en: "Analogy", ar: "مثال تقريبي" },
  comparison: { en: "Comparison", ar: "جدول مقارنة" },
  exam: { en: "Model Exam", ar: "امتحان نموذجي" },
  practice: { en: "Practice Set", ar: "مجموعة تدريب" },
  question_bank: { en: "Question Bank", ar: "بنك أسئلة" },
};

// The AI engine supports ten languages; the selected value is passed along.
export const LANGUAGE_OPTIONS = [
  { value: "en", en: "English", ar: "الإنجليزية" },
  { value: "ar", en: "Arabic", ar: "العربية" },
  { value: "fr", en: "French", ar: "الفرنسية" },
  { value: "sw", en: "Swahili", ar: "السواحيلية" },
  { value: "am", en: "Amharic", ar: "الأمهرية" },
  { value: "ha", en: "Hausa", ar: "الهوسا" },
  { value: "so", en: "Somali", ar: "الصومالية" },
  { value: "yo", en: "Yoruba", ar: "اليوروبية" },
  { value: "ig", en: "Igbo", ar: "الإيغبو" },
  { value: "zu", en: "Zulu", ar: "الزولو" },
];

export function generateResources(courseId, { topic, kinds, language }) {
  return api(`/courses/${courseId}/learning-resources`, {
    method: "POST",
    body: { topic, kinds, language },
  });
}

export async function listResources(courseId, { page = 1, limit = 50 } = {}) {
  const result = await apiFull(`/courses/${courseId}/learning-resources?page=${page}&limit=${limit}`);
  return { items: result.data ?? [], meta: result.meta };
}

export async function downloadResourceFile(resourceId, fileName = null) {
  const { accessToken } = readSession() ?? {};
  const res = await fetch(`${API_BASE}/learning-resources/${resourceId}/file`, {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const name = fileName ?? match?.[1] ?? "resource";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return name;
}

// Preview an SVG artifact inline (data URI, like the Streamlit reference).
export async function fetchArtifactDataUri(resourceId) {
  const { accessToken } = readSession() ?? {};
  const res = await fetch(`${API_BASE}/learning-resources/${resourceId}/file`, {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
