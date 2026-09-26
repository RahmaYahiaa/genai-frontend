import { useCallback } from "react";
import { useApp } from "@/store/useApp";

/**
 * Shared "course I'm studying right now" across the study loop
 * (Check level → Tutor → Study materials → Practice → Re-check → Mastery).
 * Previously each page kept its own picker and silently fell back to the
 * first course, so jumping from a course page lost the context.
 * Stored in app state (state.studyCourseId); pages still fall back to the
 * first enrolled course when nothing is chosen yet.
 */
export default function useStudyCourse() {
  const { state, dispatch } = useApp();
  const courseId = state.studyCourseId ?? "";
  const setCourseId = useCallback(
    (id) => dispatch({ type: "NAVIGATE", studyCourseId: id || undefined }),
    [dispatch],
  );
  return [courseId, setCourseId];
}
