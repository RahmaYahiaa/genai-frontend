/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useCallback } from "react";
import {
  COURSES,
  ASSIGNMENTS,
  SEED_UNITS,
  SEED_AUDIT,
  SEED_DRAFTS,
  SEED_REMEDIAL,
  ANALYTICS_AS_OF,
  DEMO_STUDENT_ID,
  INSTRUCTOR_NAME,
  evaluateAnswer,
  latestAttempt,
  approvedMaterials
} from "@/data/instructorModule";
let seq = 1e3;
const nextId = (p) => `${p}-${++seq}`;
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
function initialState() {
  return {
    courses: structuredClone(COURSES),
    assignments: structuredClone(ASSIGNMENTS),
    units: structuredClone(SEED_UNITS),
    audit: structuredClone(SEED_AUDIT),
    drafts: structuredClone(SEED_DRAFTS),
    remedial: structuredClone(SEED_REMEDIAL),
    analyticsAsOf: ANALYTICS_AS_OF
  };
}
const ModuleContext = createContext(null);
function useInstructorModule() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useInstructorModule must be used inside <InstructorModuleProvider>");
  return ctx;
}
export default function InstructorModuleProvider({ children }) {
  const [state, setState] = useState(initialState);
  const mutate = useCallback((fn) => {
    setState((s) => fn(structuredClone(s)));
  }, []);
  const auditFor = (s, u, e) => {
    s.audit.unshift({ ...e, id: nextId("au"), at: nowIso(), instructor: INSTRUCTOR_NAME });
  };
  const questionMeta = (s, u) => {
    const a = s.assignments.find((x) => x.id === u.assignmentId);
    const qi = a ? a.questions.findIndex((q2) => q2.id === u.questionId) : -1;
    const q = qi >= 0 && a ? a.questions[qi] : null;
    const short = q ? q.prompt.en.length > 46 ? `${q.prompt.en.slice(0, 46)}…` : q.prompt.en : "";
    return { assignmentTitle: a ? a.title.en : "", questionLabel: `Q${qi + 1} · ${short}` };
  };
  const publishAssignment = (courseId, draft, status = "open") => {
    const id = nextId("as");
    mutate((s) => {
      s.assignments.unshift({
        id,
        courseId,
        title: { en: draft.titleEn, ar: draft.titleAr || draft.titleEn },
        status,
        showScoreToStudent: draft.showScore,
        createdAt: nowIso(),
        questions: draft.questions
      });
      s.analyticsAsOf = nowIso();
      return s;
    });
    return id;
  };
  const updateAssignment = (id, patch) => mutate((s) => {
    const a = s.assignments.find((x) => x.id === id);
    if (!a) return s;
    a.title = { en: patch.titleEn, ar: patch.titleEn };
    a.showScoreToStudent = patch.showScore;
    a.status = patch.status;
    a.questions = patch.questions;
    s.analyticsAsOf = nowIso();
    return s;
  });
  const setAssignmentStatus = (assignmentId, status) => mutate((s) => {
    const a = s.assignments.find((x) => x.id === assignmentId);
    if (a) a.status = status;
    return s;
  });
  const setScoreVisibility = (assignmentId, next) => mutate((s) => {
    const a = s.assignments.find((x) => x.id === assignmentId);
    if (!a || a.showScoreToStudent === next) return s;
    const before = a.showScoreToStudent;
    a.showScoreToStudent = next;
    s.audit.unshift({
      id: nextId("au"),
      at: nowIso(),
      courseId: a.courseId,
      assignmentId,
      assignmentTitle: a.title.en,
      studentName: "—",
      questionLabel: "—",
      action: "visibility",
      aiScore: null,
      finalScore: null,
      instructor: INSTRUCTOR_NAME,
      visibilityBefore: before,
      visibilityAfter: next,
      note: next ? "Scores made visible to students." : "Score visibility withdrawn from students."
    });
    return s;
  });
  const applyDecision = (s, unitId, decision, auditAction, note) => {
    const u = s.units.find((x) => x.id === unitId);
    if (!u) return;
    const last = latestAttempt(u);
    last.decision = decision;
    u.status = "final";
    const meta = questionMeta(s, u);
    auditFor(s, u, {
      courseId: u.courseId,
      assignmentId: u.assignmentId,
      assignmentTitle: meta.assignmentTitle,
      studentName: u.studentName,
      questionLabel: meta.questionLabel,
      action: auditAction,
      aiScore: last.eval.aiScore,
      finalScore: decision.finalScore,
      note
    });
    s.analyticsAsOf = nowIso();
  };
  const decide = (unitId, action, payload) => mutate((s) => {
    const u = s.units.find((x) => x.id === unitId);
    if (!u) return s;
    const last = latestAttempt(u);
    const score = action === "approve" ? last.eval.aiScore ?? 0 : payload.score ?? last.eval.aiScore ?? 0;
    const feedback = action === "approve" ? last.eval.feedback : payload.feedback ?? last.eval.feedback;
    const note = action === "edit" ? "Instructor adjusted the AI suggestion." : action === "reject" ? "AI suggestion replaced by a full manual evaluation." : void 0;
    applyDecision(s, unitId, { action, finalScore: score, finalFeedback: feedback, decidedBy: INSTRUCTOR_NAME, decidedAt: nowIso() }, action, note);
    return s;
  });
  const requestResubmission = (unitId, reason) => mutate((s) => {
    const u = s.units.find((x) => x.id === unitId);
    if (!u) return s;
    const last = latestAttempt(u);
    last.resubmitReason = reason;
    last.decision = void 0;
    u.status = "resubmission_requested";
    const meta = questionMeta(s, u);
    auditFor(s, u, {
      courseId: u.courseId,
      assignmentId: u.assignmentId,
      assignmentTitle: meta.assignmentTitle,
      studentName: u.studentName,
      questionLabel: meta.questionLabel,
      action: "resubmit",
      aiScore: last.eval.aiScore,
      finalScore: null,
      note: reason
    });
    return s;
  });
  const reopenUnit = (unitId) => mutate((s) => {
    const u = s.units.find((x) => x.id === unitId);
    if (!u || u.status !== "final") return s;
    const last = latestAttempt(u);
    const prev = last.decision;
    last.decision = void 0;
    u.status = "awaiting_review";
    const meta = questionMeta(s, u);
    auditFor(s, u, {
      courseId: u.courseId,
      assignmentId: u.assignmentId,
      assignmentTitle: meta.assignmentTitle,
      studentName: u.studentName,
      questionLabel: meta.questionLabel,
      action: "reopen",
      aiScore: last.eval.aiScore,
      finalScore: null,
      note: `Reopened after ${prev?.action ?? "a"} decision — returned to pending review.`
    });
    s.analyticsAsOf = nowIso();
    return s;
  });
  const bulkApprove = (unitIds) => mutate((s) => {
    for (const id of unitIds) {
      const u = s.units.find((x) => x.id === id);
      if (!u || u.status !== "awaiting_review") continue;
      const last = latestAttempt(u);
      if (last.eval.confidence !== "high" || last.eval.aiScore === null) continue;
      applyDecision(s, id, {
        action: "approve",
        finalScore: last.eval.aiScore,
        finalFeedback: last.eval.feedback,
        decidedBy: INSTRUCTOR_NAME,
        decidedAt: nowIso()
      }, "approve", `Bulk approve (${unitIds.length} high-confidence submissions in one confirmed action).`);
    }
    return s;
  });
  const saveDraft = (assignmentId, questionId, text, image, selected) => mutate((s) => {
    s.drafts[`${assignmentId}|${questionId}`] = { text, image, selected, savedAt: nowIso() };
    return s;
  });
  const submitAssignment = (assignmentId) => mutate((s) => {
    const a = s.assignments.find((x) => x.id === assignmentId);
    if (!a || a.status !== "open") return s;
    const course = s.courses.find((c) => c.id === a.courseId);
    if (!course) return s;
    const student = { id: DEMO_STUDENT_ID, name: "Sarah Al-Rashidi" };
    for (const q of a.questions) {
      const existing = s.units.find((u) => u.assignmentId === assignmentId && u.questionId === q.id && u.studentId === student.id);
      const draft = s.drafts[`${assignmentId}|${q.id}`];
      const text = draft?.text ?? "";
      const image = draft?.image;
      const selected = draft?.selected;
      const ev = evaluateAnswer(q, text, course);
      if (existing && existing.status === "resubmission_requested") {
        existing.attempts.push({ n: existing.attempts.length + 1, text, image, selected, submittedAt: nowIso(), eval: ev });
        existing.status = "awaiting_review";
      } else if (!existing) {
        s.units.push({
          id: nextId("u"),
          assignmentId,
          courseId: a.courseId,
          questionId: q.id,
          studentId: student.id,
          studentName: student.name,
          status: "awaiting_review",
          attempts: [{ n: 1, text, image, selected, submittedAt: nowIso(), eval: ev }]
        });
      }
      delete s.drafts[`${assignmentId}|${q.id}`];
    }
    return s;
  });
  const resubmitUnit = (unitId, text, image) => mutate((s) => {
    const u = s.units.find((x) => x.id === unitId);
    if (!u || u.status !== "resubmission_requested") return s;
    const a = s.assignments.find((x) => x.id === u.assignmentId);
    if (!a || a.status !== "open") return s;
    const course = s.courses.find((c) => c.id === u.courseId);
    const q = a?.questions.find((x) => x.id === u.questionId);
    if (!course || !q) return s;
    u.attempts.push({ n: u.attempts.length + 1, text, image, submittedAt: nowIso(), eval: evaluateAnswer(q, text, course) });
    u.status = "awaiting_review";
    return s;
  });
  const addMaterial = (courseId, topicId, title, file) => mutate((s) => {
    const t = s.courses.find((c) => c.id === courseId)?.topics.find((x) => x.id === topicId);
    if (t) t.materials.push({ id: nextId("mat"), title, status: "pending", addedAt: nowIso(), file: file ?? null });
    return s;
  });
  const removeMaterial = (courseId, topicId, materialId) => mutate((s) => {
    const t = s.courses.find((c) => c.id === courseId)?.topics.find((x) => x.id === topicId);
    if (t) t.materials = t.materials.filter((m) => m.id !== materialId);
    return s;
  });
  const approveMaterial = (courseId, topicId, materialId) => mutate((s) => {
    const t = s.courses.find((c) => c.id === courseId)?.topics.find((x) => x.id === topicId);
    const m = t?.materials.find((x) => x.id === materialId);
    if (m) m.status = "approved";
    if (t && approvedMaterials(t) > 0) s.analyticsAsOf = nowIso();
    return s;
  });
  const saveRemedial = (d) => mutate((s) => {
    const i = s.remedial.findIndex((x) => x.id === d.id);
    if (i >= 0) s.remedial[i] = d;
    else s.remedial.unshift(d);
    return s;
  });
  const publishRemedial = (id) => mutate((s) => {
    const d = s.remedial.find((x) => x.id === id);
    if (d) d.status = "published";
    s.analyticsAsOf = nowIso();
    return s;
  });
  const discardRemedial = (id) => mutate((s) => {
    s.remedial = s.remedial.filter((x) => x.id !== id);
    return s;
  });
  const reset = useCallback(() => {
    seq = 1e3;
    setState(initialState());
  }, []);
  const value = useMemo(() => ({
    state,
    publishAssignment,
    updateAssignment,
    setAssignmentStatus,
    setScoreVisibility,
    decide,
    requestResubmission,
    reopenUnit,
    bulkApprove,
    saveDraft,
    submitAssignment,
    resubmitUnit,
    addMaterial,
    approveMaterial,
    removeMaterial,
    saveRemedial,
    publishRemedial,
    discardRemedial,
    reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state]);
  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}
export {
  InstructorModuleProvider,
  useInstructorModule
};