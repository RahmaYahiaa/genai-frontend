import { api, apiFull } from "@/services/http";

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  MULTIPLE_SELECT: "multiple_select",
  TRUE_FALSE: "true_false",
  SHORT_ANSWER: "short_answer",
  LONG_ANSWER: "long_answer",
  ESSAY: "essay",
  PROBLEM_SOLVING: "problem_solving",
};

export const OBJECTIVE_TYPES = [QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.MULTIPLE_SELECT, QUESTION_TYPES.TRUE_FALSE];

export const QUESTION_TYPE_LABELS = {
  multiple_choice: { en: "Multiple choice", ar: "اختيار من متعدد" },
  multiple_select: { en: "Multiple select", ar: "اختيار متعدد الإجابات" },
  true_false: { en: "True / False", ar: "صح أو خطأ" },
  short_answer: { en: "Short answer", ar: "إجابة قصيرة" },
  long_answer: { en: "Long answer", ar: "إجابة طويلة" },
  essay: { en: "Essay", ar: "مقال" },
  problem_solving: { en: "Problem solving", ar: "حل مسألة" },
};

export const ASSIGNMENT_STATUSES = { DRAFT: "DRAFT", OPEN: "OPEN", CLOSED: "CLOSED" };

export const STATUS_LABELS = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  OPEN: { en: "Open", ar: "مفتوح" },
  CLOSED: { en: "Closed", ar: "مغلق" },
};

export function mapQuestion(question) {
  return {
    id: question.id,
    orderIndex: question.orderIndex,
    text: question.questionText,
    topicId: question.topicId,
    maxScore: question.maxScore,
    type: question.questionType,
    options: question.options ?? [],
    correctOptionIds: question.correctOptionIds ?? [],
    modelAnswer: question.modelAnswer ?? null,
    rubricText: question.rubricText ?? null,
  };
}

export function mapAssignment(assignment) {
  return {
    id: assignment.id,
    courseId: assignment.courseId,
    createdBy: assignment.createdBy,
    title: { en: assignment.title, ar: assignment.title },
    status: assignment.status,
    showGradeToStudent: Boolean(assignment.showGradeToStudent),
    showFeedbackToStudent: Boolean(assignment.showFeedbackToStudent),
    createdAt: assignment.createdAt ?? null,
    updatedAt: assignment.updatedAt ?? null,
    questions: Array.isArray(assignment.questions) ? assignment.questions.map(mapQuestion) : null,
    canSubmit: assignment.canSubmit ?? null,
    submission: assignment.submission ?? null,
    resubmissionRequest: assignment.resubmissionRequest ?? null,
    workingAnswers: assignment.workingAnswers ?? null,
  };
}

export function correctIndexes(question) {
  return question.options.reduce((acc, option, index) => {
    if (question.correctOptionIds.includes(option.id)) acc.push(index);
    return acc;
  }, []);
}

export function trueFalseCorrect(question) {
  const hit = question.options.find((option) => question.correctOptionIds.includes(option.id));
  if (!hit) return null;
  return hit.text === "True";
}

export function buildQuestionBody(draft) {
  const body = {
    questionText: draft.text,
    topicId: draft.topicId,
    maxScore: draft.maxScore,
    questionType: draft.type,
  };
  if (draft.orderIndex) body.orderIndex = draft.orderIndex;
  if (draft.modelAnswer !== undefined) body.modelAnswer = draft.modelAnswer || null;
  if (draft.rubricText !== undefined) body.rubricText = draft.rubricText || null;
  if (draft.type === QUESTION_TYPES.MULTIPLE_CHOICE || draft.type === QUESTION_TYPES.MULTIPLE_SELECT) {
    body.options = draft.options.map((text) => ({ text }));
    body.correctOptionIndexes = draft.correctIndexes;
  }
  if (draft.type === QUESTION_TYPES.TRUE_FALSE) body.correctAnswer = draft.correctAnswer;
  return body;
}

export async function listAssignmentsForCourse(courseId, params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 100));
  const result = await apiFull(`/courses/${courseId}/assignments?${query.toString()}`);
  return { items: result.data.map(mapAssignment), meta: result.meta };
}

export async function createAssignment(courseId, title) {
  return mapAssignment(await api(`/courses/${courseId}/assignments`, { method: "POST", body: { title } }));
}

export async function renameAssignment(assignmentId, title) {
  return mapAssignment(await api(`/assignments/${assignmentId}`, { method: "PATCH", body: { title } }));
}

export async function getAssignment(assignmentId) {
  return mapAssignment(await api(`/assignments/${assignmentId}`));
}

export async function addQuestion(assignmentId, draft) {
  return mapQuestion(await api(`/assignments/${assignmentId}/questions`, { method: "POST", body: buildQuestionBody(draft) }));
}

export async function updateQuestion(assignmentId, questionId, draft) {
  return mapQuestion(await api(`/assignments/${assignmentId}/questions/${questionId}`, { method: "PATCH", body: buildQuestionBody(draft) }));
}

export async function deleteQuestion(assignmentId, questionId) {
  return api(`/assignments/${assignmentId}/questions/${questionId}`, { method: "DELETE" });
}

export async function publishAssignment(assignmentId) {
  return mapAssignment(await api(`/assignments/${assignmentId}/publish`, { method: "POST" }));
}

export async function closeAssignment(assignmentId) {
  return mapAssignment(await api(`/assignments/${assignmentId}/close`, { method: "POST" }));
}

export async function reopenAssignment(assignmentId) {
  return mapAssignment(await api(`/assignments/${assignmentId}/open`, { method: "POST" }));
}

export async function setGradeVisibility(assignmentId, showGradeToStudent) {
  return mapAssignment(await api(`/assignments/${assignmentId}/grade-visibility`, { method: "PATCH", body: { showGradeToStudent } }));
}

export async function setFeedbackVisibility(assignmentId, showFeedbackToStudent) {
  return mapAssignment(await api(`/assignments/${assignmentId}/feedback-visibility`, { method: "PATCH", body: { showFeedbackToStudent } }));
}