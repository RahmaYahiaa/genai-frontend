import { api, apiFull, ApiError, API_BASE, readSession } from "@/services/http";

export function mapCourse(course) {
  return {
    id: course.id,
    code: course.code ?? null,
    title: { en: course.title, ar: course.title },
    description: course.description ?? null,
    isPersonal: Boolean(course.isPersonal),
    ownerId: course.ownerId ?? null,
    institutionId: course.institutionId ?? null,
    isActive: course.isActive ?? true,
    staff: course.staff ?? [],
    topics: (course.topics ?? []).map((topic) => ({
      id: topic.id,
      label: { en: topic.title, ar: topic.title },
      order: topic.order ?? 0,
      description: topic.description ?? null,
      materials: [],
    })),
    overall: null,
    week: null,
  };
}

export function mapMaterial(material) {
  return {
    id: material.id,
    title: material.title,
    topicId: material.topicId ?? null,
    status: material.status ?? "pending",
    statusError: material.statusError ?? null,
    mimeType: material.mimeType ?? null,
    originalName: material.originalName ?? null,
    sizeBytes: material.sizeBytes ?? 0,
    hasFile: Boolean(material.hasFile),
    chunkCount: material.chunkCount ?? 0,
    createdAt: material.createdAt ?? null,
    file: material.hasFile
      ? { fileName: material.originalName ?? material.title, mime: material.mimeType ?? "", size: material.sizeBytes ?? 0 }
      : null,
  };
}

export async function listCourses(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 50));
  const result = await apiFull(`/courses?${query.toString()}`);
  return { items: result.data.map(mapCourse), meta: result.meta };
}

export async function getCourse(courseId) {
  return mapCourse(await api(`/courses/${courseId}`));
}

export async function listEnrollments(courseId, params = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 100));
  const result = await apiFull(`/courses/${courseId}/enrollments?${query.toString()}`);
  return { items: result.data ?? [], total: result.meta?.total ?? 0 };
}

export async function createPersonalCourse(title) {
  return mapCourse(await api("/courses", { method: "POST", body: { title } }));
}

export async function addTopic(courseId, title) {
  return api(`/courses/${courseId}/topics`, { method: "POST", body: { title } });
}

export async function deleteTopic(courseId, topicId) {
  return api(`/courses/${courseId}/topics/${topicId}`, { method: "DELETE" });
}

export async function listMaterials(courseId) {
  const result = await apiFull(`/courses/${courseId}/materials?limit=100`);
  return result.data.map(mapMaterial);
}

export async function uploadMaterialFile(courseId, file, title, topicId = null) {
  const body = new FormData();
  body.append("file", file);
  if (title) body.append("title", title);
  if (topicId) body.append("topicId", topicId);
  return mapMaterial(await api(`/courses/${courseId}/materials/file`, { method: "POST", body }));
}

export async function renameMaterial(courseId, materialId, title) {
  return mapMaterial(await api(`/courses/${courseId}/materials/${materialId}`, { method: "PATCH", body: { title } }));
}

export async function deleteMaterial(courseId, materialId) {
  return api(`/courses/${courseId}/materials/${materialId}`, { method: "DELETE" });
}

export async function downloadMaterial(courseId, materialId, fileName) {
  const session = readSession();
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
  const res = await fetch(`${API_BASE}/courses/${courseId}/materials/${materialId}/file`, { headers });
  if (!res.ok) throw new ApiError(res.status, "DOWNLOAD_FAILED", "Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "material";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function listInstitutionCatalog({ search, page = 1, limit = 20, year } = {}) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (year) params.set("year", String(year));
  const result = await apiFull(`/courses/catalog?${params.toString()}`);
  return { items: result.data ?? [], meta: result.meta };
}

export async function catalogEnroll(courseId) {
  return api(`/courses/${courseId}/catalog-enroll`, { method: "POST" });
}

export async function requestCourseEnrollment(courseId, { note, proof }) {
  return api(`/courses/${courseId}/enrollment-request`, { method: "POST", body: { note, proof } });
}

export async function listMyEnrollmentRequests({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const result = await apiFull(`/courses/enrollment-requests/my?${params.toString()}`);
  return { items: result.data ?? [], meta: result.meta };
}

export async function createCourse(payload) {
  return api("/courses", { method: "POST", body: payload });
}

export async function getCreationPolicy() {
  return api("/courses/creation-policy");
}