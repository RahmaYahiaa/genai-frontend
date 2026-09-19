import { STORAGE_KEYS } from "@/constants/routes";

const ENV = import.meta.env ?? {};
export const API_BASE = ENV.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details ?? null;
  }
}

const AR_MESSAGES = [
  ["Invalid email or password", "البريد الإلكتروني أو كلمة المرور غير صحيحة."],
  ["An account with this email already exists", "فيه حساب مسجل بالإيميل ده بالفعل — سجّل دخول بدل ما تعمل حساب جديد."],
  ["students of a contracted university register through their institution", "الإيميل ده تابع لجامعة متعاقدة مع المنصة — هتتسجل من خلال مؤسستك في الخطوة الجاية."],
  ["not contracted with the platform", "الجامعة مش متعاقدة مع المنصة حالياً — سجّل بإيميل شخصي."],
  ["does not allow self-registration", "الجامعة مش بتسمح بالتسجيل الذاتي — تواصل مع إدارة الجامعة."],
  ["requires an email under its verified domains", "التسجيل في الجامعة دي محتاج إيميل من النطاقات الموثّقة بتاعتها."],
  ["requires verified email domains", "تسجيل الجامعة محتاج نطاقات بريد موثّقة — تواصل مع إدارة الجامعة."],
  ["Password must be at least 8 characters", "كلمة المرور لازم تكون 8 أحرف على الأقل."],
  ["Password must contain at least one letter", "كلمة المرور لازم تحتوي على حرف واحد على الأقل."],
  ["Password must contain at least one number", "كلمة المرور لازم تحتوي على رقم واحد على الأقل."],
  ["A valid email address is required", "لازم تدخل بريد إلكتروني صحيح."],
  ["firstName is required", "الاسم الأول مطلوب."],
  ["lastName is required", "اسم العائلة مطلوب."],
  ["institutionId is required for instructors", "حساب المدرّس محتاج جامعة مسجلة — الإيميل ده مش مرتبط بمؤسسة متعاقدة."],
];

export function apiErrorText(err, lang) {
  const ar = lang === "ar";
  if (err?.code === "NETWORK_ERROR") {
    return ar ? "لا يمكن الوصول إلى الخادم — تأكد إن الباك إند شغال." : "Cannot reach the server — make sure the backend is running.";
  }
  if (err?.code === "NOT_BACKEND") {
    return ar
      ? "اللي رد على العنوان ده مش باك إند GenAI — تأكد إن genai-backend شغال على البورت 3000 ومفيش تطبيق تاني واخد البورت، واعمل restart للفرونت بعد أي تعديل في .env."
      : "The server answering on this address is not the GenAI backend — make sure genai-backend is running on port 3000 (and no other app took the port), then restart the frontend after any .env change.";
  }
  if (err?.code === "API_NOT_CONFIGURED") {
    return ar ? "اضبط VITE_API_URL في ملف .env بتاع الفرونت." : "Set VITE_API_URL in the frontend .env file.";
  }
  const raw = [err?.message, ...(Array.isArray(err?.details) ? err.details.map((d) => d.message) : [])].filter(Boolean);
  const translate = (text) => {
    if (!ar) return text;
    const hit = AR_MESSAGES.find(([key]) => text.includes(key));
    return hit ? hit[1] : text;
  };
  if (raw.length > 0 && err?.code !== "REQUEST_FAILED") {
    return raw.map(translate).join(" · ");
  }
  if (err?.status === 404) {
    return ar
      ? "مسار الـ API مش موجود على السيرفر — تأكد إن VITE_API_URL بينتهي بـ /api/v1."
      : "The API path was not found on the server — make sure VITE_API_URL ends with /api/v1.";
  }
  if (err?.status === 429) {
    return ar ? "محاولات كتير ورا بعض — استنى شوية وحاول تاني." : "Too many attempts — wait a moment and try again.";
  }
  if (err?.status >= 500) {
    return ar ? "حصلت مشكلة في السيرفر — حاول تاني بعد شوية." : "Something went wrong on the server — please try again shortly.";
  }
  if (raw.length > 0) return raw.map(translate).join(" · ");
  return ar ? "حصل خطأ غير متوقع — حاول تاني." : "An unexpected error occurred — please try again.";
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  if (session) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

let refreshPromise = null;

async function performRefresh(session) {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.success) {
          throw new ApiError(res.status, body?.error?.code ?? "REFRESH_FAILED", body?.error?.message ?? "Session expired");
        }
        const next = {
          ...session,
          accessToken: body.data.tokens.accessToken,
          refreshToken: body.data.tokens.refreshToken,
        };
        writeSession(next);
        return next;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function buildInit(method, body, headers, accessToken) {
  const init = { method, headers: { ...(headers ?? {}) } };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  if (accessToken) init.headers.Authorization = `Bearer ${accessToken}`;
  return init;
}

async function send(path, init) {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the API server");
  }
}

function fail(status, payload, codeOverride) {
  if (status === 401) {
    clearSession();
    if (unauthorizedHandler) unauthorizedHandler();
  }
  throw new ApiError(
    status,
    codeOverride ?? payload?.error?.code ?? "REQUEST_FAILED",
    payload?.error?.message ?? `Request failed (${status}) [${codeOverride ?? "REQUEST_FAILED"}]`,
    payload?.error?.details,
  );
}

export async function apiFull(path, { method = "GET", body, headers, retry = true } = {}) {
  if (!API_BASE) throw new ApiError(0, "API_NOT_CONFIGURED", "VITE_API_URL is not configured");
  const session = readSession();
  const init = buildInit(method, body, headers, session?.accessToken);
  let res = await send(path, init);

  if (res.status === 401 && retry && session?.refreshToken) {
    try {
      const next = await performRefresh(session);
      init.headers.Authorization = `Bearer ${next.accessToken}`;
      res = await send(path, init);
    } catch {
      fail(401, null);
    }
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    const ctype = res.headers.get("content-type") ?? "";
    if (!payload && ctype.includes("text/html")) fail(res.status, null, "NOT_BACKEND");
    fail(res.status, payload);
  }
  return { data: payload.data, meta: payload.meta ?? null };
}

export async function api(path, options = {}) {
  const result = await apiFull(path, options);
  return result.data;
}